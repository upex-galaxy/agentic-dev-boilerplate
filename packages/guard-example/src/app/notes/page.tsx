import { listNotes, NoteList } from '@features/notes';

export default async function NotesPage() {
  return <NoteList notes={await listNotes()} />;
}
