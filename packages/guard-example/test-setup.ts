import { mock } from 'bun:test';

// WHY: the repo root has no React; the example only needs JSX to parse, never to render.
mock.module('react/jsx-dev-runtime', () => ({
  Fragment: Symbol.for('fragment'),
  jsxDEV: (type: unknown, props: unknown) => ({ type, props }),
}));
