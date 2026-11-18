import type { Result } from '@platform/result';
import type { NewNote } from './types';
import { fail, ok } from '@platform/result';

const MAX_TITLE = 80;

export function validateNewNote(input: NewNote): Result<NewNote> {
  const title = input.title.trim();
  if (title === '') { return fail('title is required'); }
  if (title.length > MAX_TITLE) { return fail(`title is longer than ${MAX_TITLE} characters`); }
  return ok({ title, body: input.body.trim() });
}
