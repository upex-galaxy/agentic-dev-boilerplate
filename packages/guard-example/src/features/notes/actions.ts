import type { NotesRepository } from '@adapters/notes';
import type { Result } from '@platform/result';
import type { NewNote, Note } from './types';
import { notesRepository } from '@adapters/notes';
import { ok } from '@platform/result';

import { validateNewNote } from './domain';

export async function createNote(input: NewNote, repo: NotesRepository = notesRepository): Promise<Result<Note>> {
  const valid = validateNewNote(input);
  if (!valid.ok) { return valid; }
  return ok(await repo.insert(valid.value));
}

export async function listNotes(repo: NotesRepository = notesRepository): Promise<Note[]> {
  return repo.list();
}
