import type { Env } from '@platform/env';

import type { NotesRepository } from './port';
import type { SupabaseLike } from './supabase';
import { readEnv } from '@platform/env';

import { createMemoryNotesRepository } from './memory';
import { createSupabaseNotesRepository } from './supabase';

export { createMemoryNotesRepository } from './memory';
export type { NoteRecord, NotesRepository } from './port';
export { createSupabaseNotesRepository } from './supabase';
export type { SupabaseLike } from './supabase';

export function selectNotesRepository(env: Env, client?: SupabaseLike): NotesRepository {
  return env.notesStore === 'supabase' && client ? createSupabaseNotesRepository(client) : createMemoryNotesRepository();
}

export const notesRepository = selectNotesRepository(readEnv());
