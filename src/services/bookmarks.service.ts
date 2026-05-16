import { supabase } from '@/lib/supabase'
import type { Bookmark, Event } from '@/lib/database.types'

/** Add a bookmark for the current user */
export async function addBookmark(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .insert({ user_id: userId, event_id: eventId } as any)

  if (error) {
    // Ignore unique constraint violation (already bookmarked)
    if (error.code === '23505') return
    throw error
  }
}

/** Remove a bookmark */
export async function removeBookmark(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId)

  if (error) throw error
}

/** Check if a specific event is bookmarked by the user */
export async function isBookmarked(userId: string, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  return !!data
}

/** Fetch all bookmarked events for the current user (with event data) */
export async function getBookmarks(userId: string): Promise<(Bookmark & { event: Event })[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      *,
      event:events(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as any
}
