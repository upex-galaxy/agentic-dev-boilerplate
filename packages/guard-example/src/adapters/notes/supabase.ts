import type { NoteRecord, NotesRepository } from './port';

interface QueryResult<T> {
  data: T | null
  error: { message: string } | null
}

export interface SupabaseLike {
  from: (table: string) => {
    insert: (row: Omit<NoteRecord, 'id' | 'createdAt'>) => { select: () => { single: () => Promise<QueryResult<NoteRecord>> } }
    select: () => Promise<QueryResult<NoteRecord[]>>
  }
}

export function createSupabaseNotesRepository(client: SupabaseLike): NotesRepository {
  return {
    async insert(note) {
      const { data, error } = await client.from('notes').insert(note).select().single();
      if (error || !data) { throw new Error(error?.message ?? 'insert returned no row'); }
      return data;
    },
    async list() {
      const { data, error } = await client.from('notes').select();
      if (error || !data) { throw new Error(error?.message ?? 'select returned no rows'); }
      return data;
    },
  };
}
