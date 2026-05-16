import { supabase } from '@/lib/supabase'

/** Join the waitlist for an event */
export async function joinWaitlist(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('waitlist')
    .insert({ user_id: userId, event_id: eventId, notified: false } as any)

  if (error) {
    if (error.code === '23505') throw new Error('You are already on the waitlist')
    throw error
  }
}

/** Leave the waitlist */
export async function leaveWaitlist(userId: string, eventId: string): Promise<void> {
  const { error } = await supabase
    .from('waitlist')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId)

  if (error) throw error
}

/** Get the user's position on the waitlist (null if not on it) */
export async function getWaitlistPosition(userId: string, eventId: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('waitlist')
    .select('position')
    .eq('user_id', userId)
    .eq('event_id', eventId)
    .maybeSingle()

  if (error) throw error
  return data?.position ?? null
}

/** Get the total waitlist count for an event */
export async function getWaitlistCount(eventId: string): Promise<number> {
  const { count, error } = await supabase
    .from('waitlist')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('notified', false)

  if (error) throw error
  return count ?? 0
}
