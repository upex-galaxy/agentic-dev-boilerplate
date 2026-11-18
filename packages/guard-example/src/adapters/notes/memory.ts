import type { NoteRecord, NotesRepository } from './port';

export function createMemoryNotesRepository(): NotesRepository {
  const rows: NoteRecord[] = [];
  return {
    async insert(note) {
      const row = { ...note, id: String(rows.length + 1), createdAt: new Date().toISOString() };
      rows.push(row);
      return row;
    },
    async list() {
      return [...rows];
    },
  };
}
