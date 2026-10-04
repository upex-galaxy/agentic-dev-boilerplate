import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, test } from 'bun:test';
import { applyAllowListMerge, CLAUDE_SETTINGS_FILE, mergeAdoptPromptHook, mergeAllowList } from './updater-settings.ts';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'updater settings '));
  temporaryRoots.push(root);
  return root;
}

function write(root: string, relativePath: string, contents: string): void {
  const destination = join(root, relativePath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, contents);
}

/** A settings file with the given allow list plus the keys nothing may touch. */
function settings(allow: string[], extra: Record<string, unknown> = {}): string {
  return `${JSON.stringify({
    permissions: { allow, deny: ['Bash(rm -rf *)'], ask: [] },
    hooks: { UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node hook.mjs' }] }] },
    env: { BASH_DEFAULT_TIMEOUT_MS: '300000' },
    ...extra,
  }, null, 2)}\n`;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) { rmSync(root, { recursive: true, force: true }); }
});

describe('the Claude permission allow list merges additively', () => {
  test('entries upstream added are appended in upstream order; nothing else moves', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read', 'Skill(acli)', 'Bash(bun *)']));
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read', 'Skill(acli)', 'Skill(vercel-cli)', 'Skill(autonomous-delivery)']));

    const { added, merged } = mergeAllowList(root, upstream);
    expect(added).toEqual(['Skill(vercel-cli)', 'Skill(autonomous-delivery)']);
    const after = JSON.parse(merged!) as { permissions: { allow: string[], deny: string[], ask: string[] } };
    // The project's own order is preserved and its own entry survives: append,
    // never re-sort, never drop.
    expect(after.permissions.allow).toEqual([
      'Read',
      'Skill(acli)',
      'Bash(bun *)',
      'Skill(vercel-cli)',
      'Skill(autonomous-delivery)',
    ]);
    expect(after.permissions.deny).toEqual(['Bash(rm -rf *)']);
  });

  test('deny, ask, hooks, env and unknown keys come back byte-identical', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read'], { cleanupPeriodDays: 60, projectOnlyKey: { a: 1 } }));
    // Upstream disagrees about every one of them. None of it may travel.
    write(upstream, CLAUDE_SETTINGS_FILE, JSON.stringify({
      permissions: { allow: ['Read', 'Skill(new)'], deny: ['Bash(everything *)'], ask: ['Write'] },
      hooks: {},
      env: { BASH_DEFAULT_TIMEOUT_MS: '1' },
      cleanupPeriodDays: 1,
    }, null, 2));

    const { merged } = mergeAllowList(root, upstream);
    const before = JSON.parse(readFileSync(join(root, CLAUDE_SETTINGS_FILE), 'utf-8')) as Record<string, unknown>;
    const after = JSON.parse(merged!) as Record<string, unknown>;
    expect(after.permissions).toMatchObject({ deny: ['Bash(rm -rf *)'], ask: [] });
    for (const key of ['hooks', 'env', 'cleanupPeriodDays', 'projectOnlyKey']) {
      expect(after[key]).toEqual(before[key]);
    }
  });

  test('a project that removed an entry gets it back — accepted, and deny is how to say no', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read']));
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read', 'Bash(curl *)']));
    expect(mergeAllowList(root, upstream).added).toEqual(['Bash(curl *)']);
    // Twice in a row, because nothing remembers removals by design: the same
    // entry re-appears on every sync until the project expresses it in `deny`.
    applyAllowListMerge(root, upstream);
    expect(mergeAllowList(root, upstream).added).toEqual([]);
  });

  test('nothing to add, an unreadable side or a file without a permissions block writes nothing', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    // Already a superset of upstream.
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read', 'Write']));
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read']));
    expect(mergeAllowList(root, upstream).merged).toBeNull();
    // Upstream missing entirely.
    expect(mergeAllowList(root, temporaryRoot()).merged).toBeNull();
    // Unparseable project copy: never rewrite a file we cannot read.
    write(root, CLAUDE_SETTINGS_FILE, '{ not json');
    expect(mergeAllowList(root, upstream).merged).toBeNull();
    // A shape this merge does not understand is left alone, not guessed at.
    write(root, CLAUDE_SETTINGS_FILE, '{\n  "env": {}\n}\n');
    expect(mergeAllowList(root, upstream).merged).toBeNull();
    write(root, CLAUDE_SETTINGS_FILE, '{\n  "permissions": { "deny": [] }\n}\n');
    expect(mergeAllowList(root, upstream).merged).toBeNull();
  });

  test('--adopt creates the allow list an app settings file lacks, keeping every other key', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read', 'Skill(new)']));
    write(root, CLAUDE_SETTINGS_FILE, '{\n  "env": { "A": "1" },\n  "hooks": {}\n}\n');
    const created = mergeAllowList(root, upstream, { createMissing: true });
    expect(created.added).toEqual(['Read', 'Skill(new)']);
    expect(JSON.parse(created.merged!)).toEqual({ env: { A: '1' }, hooks: {}, permissions: { allow: ['Read', 'Skill(new)'] } });
    // A permissions block with deny only gets an allow beside it; deny untouched.
    write(root, CLAUDE_SETTINGS_FILE, '{\n  "permissions": { "deny": ["Bash(rm *)"] }\n}\n');
    expect(JSON.parse(mergeAllowList(root, upstream, { createMissing: true }).merged!))
      .toEqual({ permissions: { deny: ['Bash(rm *)'], allow: ['Read', 'Skill(new)'] } });
    // A value of another shape is still never guessed at.
    write(root, CLAUDE_SETTINGS_FILE, '{\n  "permissions": ["Read"]\n}\n');
    expect(mergeAllowList(root, upstream, { createMissing: true }).merged).toBeNull();
    write(root, CLAUDE_SETTINGS_FILE, '{\n  "permissions": { "allow": "Read" }\n}\n');
    expect(mergeAllowList(root, upstream, { createMissing: true }).merged).toBeNull();
  });

  test('the file keeps its indent and trailing-newline style', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    // Four-space indent, no trailing newline.
    write(root, CLAUDE_SETTINGS_FILE, JSON.stringify({ permissions: { allow: ['Read'] } }, null, 4));
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read', 'Skill(new)']));
    const { merged } = mergeAllowList(root, upstream);
    expect(merged).toContain('\n    "permissions"');
    expect(merged!.endsWith('\n')).toBe(false);
  });

  test('applyAllowListMerge writes the file and reports what it added', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read']));
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read', 'Skill(new)']));
    expect(applyAllowListMerge(root, upstream)).toEqual(['Skill(new)']);
    const onDisk = JSON.parse(readFileSync(join(root, CLAUDE_SETTINGS_FILE), 'utf-8')) as { permissions: { allow: string[] } };
    expect(onDisk.permissions.allow).toEqual(['Read', 'Skill(new)']);
  });
});

describe('--adopt: the agent-context hook joins an app settings file that has none', () => {
  // upexgalaxy-webapp's file: a plugin switch and its own SessionStart hook, no permissions, no UserPromptSubmit.
  const APP = `${JSON.stringify({
    enabledPlugins: { 'caveman@caveman': false },
    hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'cat orca-mode.md', timeout: 5 }] }] },
  }, null, 2)}\n`;

  test('added beside the app\'s own hooks; every other key untouched', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, APP);
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read']));
    const { added, merged } = mergeAdoptPromptHook(root, upstream);
    expect(added).toBe(true);
    const out = JSON.parse(merged!) as Record<string, any>;
    expect(out.hooks.UserPromptSubmit).toEqual([{ hooks: [{ type: 'command', command: 'node hook.mjs' }] }]);
    expect(out.hooks.SessionStart).toEqual(JSON.parse(APP).hooks.SessionStart);
    expect(out.enabledPlugins).toEqual({ 'caveman@caveman': false });
    expect(out.permissions).toBeUndefined();
  });

  test('an app that wires its own UserPromptSubmit keeps it; nothing is written', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read']).replace('node hook.mjs', 'the app hook'));
    write(upstream, CLAUDE_SETTINGS_FILE, settings(['Read']));
    expect(mergeAdoptPromptHook(root, upstream)).toEqual({ added: false, rearmAdded: [], merged: null });
    expect(readFileSync(join(root, CLAUDE_SETTINGS_FILE), 'utf8')).toContain('the app hook');
  });

  const COMPACT = { matcher: 'compact', hooks: [{ type: 'command', command: 'node hook.mjs', timeout: 5 }] };
  const CLEAR = { matcher: 'clear', hooks: [{ type: 'command', command: 'node hook.mjs', timeout: 5 }] };
  const upstreamWithRearm = () => settings(['Read'], { hooks: {
    UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node hook.mjs' }] }],
    SessionStart: [COMPACT, CLEAR],
  } });

  test('the compact and clear re-arm groups are appended after the app\'s own SessionStart groups', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, APP);
    write(upstream, CLAUDE_SETTINGS_FILE, upstreamWithRearm());
    const { added, rearmAdded, merged } = mergeAdoptPromptHook(root, upstream);
    expect({ added, rearmAdded }).toEqual({ added: true, rearmAdded: ['compact', 'clear'] });
    const out = JSON.parse(merged!) as Record<string, any>;
    expect(out.hooks.SessionStart).toEqual([...JSON.parse(APP).hooks.SessionStart, COMPACT, CLEAR]);
    expect(out.enabledPlugins).toEqual({ 'caveman@caveman': false });
  });

  test('an app that already wires UserPromptSubmit still gets the re-arm groups; its hook is kept', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read']).replace('node hook.mjs', 'the app hook'));
    write(upstream, CLAUDE_SETTINGS_FILE, upstreamWithRearm());
    const { added, rearmAdded, merged } = mergeAdoptPromptHook(root, upstream);
    expect({ added, rearmAdded }).toEqual({ added: false, rearmAdded: ['compact', 'clear'] });
    const out = JSON.parse(merged!) as Record<string, any>;
    expect(out.hooks.UserPromptSubmit).toEqual([{ hooks: [{ type: 'command', command: 'the app hook' }] }]);
    expect(out.hooks.SessionStart).toEqual([COMPACT, CLEAR]);
  });

  test('an app with its own compact group keeps it and gets only the clear group', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    const own = { matcher: 'compact', hooks: [{ type: 'command', command: 'the app re-arm' }] };
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read'], { hooks: {
      UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node hook.mjs' }] }],
      SessionStart: [own],
    } }));
    write(upstream, CLAUDE_SETTINGS_FILE, upstreamWithRearm());
    const { added, rearmAdded, merged } = mergeAdoptPromptHook(root, upstream);
    expect({ added, rearmAdded }).toEqual({ added: false, rearmAdded: ['clear'] });
    expect((JSON.parse(merged!) as { hooks: { SessionStart: unknown[] } }).hooks.SessionStart).toEqual([own, CLEAR]);
  });

  test('an app with its own compact and clear groups keeps them; nothing is written', () => {
    const root = temporaryRoot();
    const upstream = temporaryRoot();
    const own = [
      { matcher: 'compact', hooks: [{ type: 'command', command: 'the app re-arm' }] },
      { matcher: 'clear', hooks: [{ type: 'command', command: 'the app re-arm' }] },
    ];
    write(root, CLAUDE_SETTINGS_FILE, settings(['Read'], { hooks: {
      UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node hook.mjs' }] }],
      SessionStart: own,
    } }));
    write(upstream, CLAUDE_SETTINGS_FILE, upstreamWithRearm());
    expect(mergeAdoptPromptHook(root, upstream)).toEqual({ added: false, rearmAdded: [], merged: null });
  });
});
