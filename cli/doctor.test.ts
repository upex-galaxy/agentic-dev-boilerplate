import { describe, expect, test } from 'bun:test';

import { worktreeSetupAction } from './doctor.ts';

describe('worktreeSetupAction', () => {
  test('a provisioned worktree needs nothing', () => {
    expect(worktreeSetupAction({ envFile: true, deps: true, gitHooks: true })).toBeNull();
  });

  test('anything missing collapses into one worktree:provision action that names what is missing', () => {
    const action = worktreeSetupAction({ envFile: false, deps: true, gitHooks: false });
    expect(action?.target).toBe('bun run worktree:provision');
    expect(action?.hint).toContain('.env, .husky/_ (git hooks)');
    expect(action?.hint).not.toContain('node_modules');
  });
});
