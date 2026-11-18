export interface NoteRecord {
  id: string
  title: string
  body: string
  createdAt: string
}

export interface NotesRepository {
  insert: (note: Omit<NoteRecord, 'id' | 'createdAt'>) => Promise<NoteRecord>
  list: () => Promise<NoteRecord[]>
}
