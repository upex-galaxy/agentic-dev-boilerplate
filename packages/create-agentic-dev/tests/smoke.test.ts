import { describe, expect, test } from 'bun:test';

import { parseArgs } from '../src/args.ts';
import { CliError } from '../src/errors.ts';
import { sanitizeProjectName } from '../src/prepare.ts';

describe('parseArgs', () => {
  test('accepts a project name as positional', () => {
    const a = parseArgs(['my-app']);
    expect(a.projectName).toBe('my-app');
    expect(a.here).toBe(false);
    expect(a.template).toBe('main');
  });

  test('rejects missing project name without --here', () => {
    expect(() => parseArgs([])).toThrow(CliError);
  });

  test('accepts --here without a name', () => {
    const a = parseArgs(['--here']);
    expect(a.here).toBe(true);
    expect(a.projectName).toBeUndefined();
  });

  test('parses --template and --template-repo', () => {
    const a = parseArgs(['my-app', '--template', 'develop', '--template-repo', 'fork/agentic-dev-boilerplate']);
    expect(a.template).toBe('develop');
    expect(a.templateRepo).toBe('fork/agentic-dev-boilerplate');
  });

  test('parses skip flags', () => {
    const a = parseArgs(['my-app', '--no-install', '--no-setup', '--no-git']);
    expect(a.noInstall).toBe(true);
    expect(a.noSetup).toBe(true);
    expect(a.noGit).toBe(true);
  });

  test('rejects unknown flag', () => {
    expect(() => parseArgs(['--bogus'])).toThrow(CliError);
  });

  test('rejects flag missing value', () => {
    expect(() => parseArgs(['my-app', '--template'])).toThrow(CliError);
  });
});

describe('sanitizeProjectName', () => {
  test('lowercases and replaces invalid chars', () => {
    expect(sanitizeProjectName('My App!')).toBe('my-app');
  });

  test('collapses repeated dashes', () => {
    expect(sanitizeProjectName('foo---bar')).toBe('foo-bar');
  });

  test('trims leading/trailing dashes', () => {
    expect(sanitizeProjectName('-foo-')).toBe('foo');
  });

  test('clamps to 214 chars', () => {
    const long = 'a'.repeat(300);
    expect(sanitizeProjectName(long).length).toBeLessThanOrEqual(214);
  });
});
