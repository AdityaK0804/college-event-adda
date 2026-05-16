import { supabase } from '@/lib/supabase'
import type { Event } from '@/lib/database.types'

/** Fetch all events with status = 'pending' (admin only) */
export async function getPendingEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

/** Approve an event — sets status to 'active' (publicly visible) */
export async function approveEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'active' })
    .eq('id', eventId)

  if (error) throw error
}

/** Reject an event — sets status to 'rejected' */
export async function rejectEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .update({ status: 'rejected' as any })
    .eq('id', eventId)

  if (error) throw error
}
