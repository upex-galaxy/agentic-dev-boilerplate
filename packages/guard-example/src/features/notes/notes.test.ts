import { createMemoryNotesRepository } from '@adapters/notes';

import { createNote, listNotes } from '@features/notes';
import { describe, expect, test } from 'bun:test';

describe('notes feature through its door', () => {
  test('createNote stores a trimmed note and listNotes returns it', async () => {
    const repo = createMemoryNotesRepository();
    const created = await createNote({ title: '  Plan  ', body: ' ship ' }, repo);
    expect(created.ok).toBe(true);
    const notes = await listNotes(repo);
    expect(notes.map(n => [n.title, n.body])).toEqual([['Plan', 'ship']]);
  });

  test('createNote rejects an empty title and stores nothing', async () => {
    const repo = createMemoryNotesRepository();
    const created = await createNote({ title: '   ', body: 'x' }, repo);
    expect(created).toEqual({ ok: false, error: 'title is required' });
    expect(await listNotes(repo)).toEqual([]);
  });

  test('createNote rejects a title over 80 characters', async () => {
    const created = await createNote({ title: 'a'.repeat(81), body: '' }, createMemoryNotesRepository());
    expect(created.ok).toBe(false);
  });
});
