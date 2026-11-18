import type { Note } from './types';

export function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) { return <p>No notes yet.</p>; }
  return (
    <ul>
      {notes.map(note => (
        <li key={note.id}>
          <strong>{note.title}</strong>
          <p>{note.body}</p>
        </li>
      ))}
    </ul>
  );
}
