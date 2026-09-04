import { describe, expect, test } from 'bun:test';

import { validateComponentRegistry } from './lib/updater-core.ts';
import { COMPONENTS } from './update-boilerplate.ts';

describe('component registry', () => {
  test('no two components claim the same path', () => {
    expect(() => validateComponentRegistry(COMPONENTS)).not.toThrow();
  });

  test('.claude/settings.json ships once (bootstrap-only) and stays out of every directory component', () => {
    const rootConfig = COMPONENTS.find(c => c.name === 'agent-root-config');
    expect(rootConfig).toMatchObject({ type: 'file-list', paths: ['.claude'], files: ['settings.json'], bootstrapOnly: true });
    // `.claude` itself is never a directory component: `commands` owns
    // `.claude/commands`, the alias `.claude/skills` is generated.
    expect(COMPONENTS.filter(c => c.type !== 'file-list').flatMap(c => c.paths)).not.toContain('.claude');
  });
});
