export interface Env {
  notesStore: 'memory' | 'supabase'
}

export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  return { notesStore: source.NOTES_STORE === 'supabase' ? 'supabase' : 'memory' };
}
