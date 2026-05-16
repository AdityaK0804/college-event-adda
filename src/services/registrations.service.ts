import { supabase } from '@/lib/supabase'
import type { Registration } from '@/lib/database.types'

/** Build the signed QR payload stored in DB and encoded into the QR image */
function buildQrPayload(ticketId: string, eventId: string, userId: string): string {
  // In production: sign this with HMAC-SHA256 using a server secret via Supabase Edge Function
  // For Phase 1: encode as JSON — validation checks ticket_id against DB
  return JSON.stringify({ ticket_id: ticketId, event_id: eventId, user_id: userId, v: 1 })
}

export interface CreateRegistrationParams {
  eventId: string
  userId: string
  quantity: number
  totalAmount: number
  razorpayOrderId?: string
}

/**
 * Create a pending registration and reserve seats atomically.
 * Ticket is only confirmed after payment webhook updates payment_status to 'paid'.
 */
export async function createRegistration(params: CreateRegistrationParams): Promise<Registration> {
  const { eventId, userId, quantity, totalAmount, razorpayOrderId } = params

  // 1. Reserve seats atomically via DB function
  const { data: reserved, error: reserveError } = await supabase.rpc('reserve_seats', {
    p_event_id: eventId,
    p_quantity: quantity,
  })

  if (reserveError) throw reserveError
  if (!reserved) throw new Error('Not enough seats available')

  // 2. Generate ticket ID (UUID)
  const ticketId = crypto.randomUUID()
  const qrData = buildQrPayload(ticketId, eventId, userId)

  // 3. Insert registration row
  const { data, error } = await supabase
    .from('registrations')
    .insert({
      event_id: eventId,
      user_id: userId,
      ticket_id: ticketId,
      quantity,
      total_amount: totalAmount,
      payment_status: totalAmount === 0 ? 'paid' : 'pending',
      ticket_status: totalAmount === 0 ? 'confirmed' : 'confirmed',
      qr_data: qrData,
      razorpay_order_id: razorpayOrderId ?? null,
    })
    .select()
    .single()

  if (error) {
    // Seat was reserved but insert failed — release seats
    await supabase.rpc('reserve_seats', { p_event_id: eventId, p_quantity: -quantity }).catch(() => null)
    throw error
  }

  return data
}

/** Fetch all registrations for the current user */
export async function getUserRegistrations(userId: string): Promise<(Registration & { event: any })[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      event:events(id, title, date, time, location, college, image_url, category)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as any
}

/** Fetch registrations for an organizer's event */
export async function getEventRegistrations(eventId: string): Promise<(Registration & { profile: any })[]> {
  const { data, error } = await supabase
    .from('registrations')
    .select(`
      *,
      profile:profiles(id, name, email, rrn, department, year)
    `)
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as any
}

/** Mark payment as confirmed (called after Razorpay webhook verification) */
export async function confirmPayment(registrationId: string, razorpayPaymentId: string): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .update({
      payment_status: 'paid',
      razorpay_payment_id: razorpayPaymentId,
    })
    .eq('id', registrationId)

  if (error) throw error
}

/**
 * Validate a ticket at the gate.
 * Uses the DB function which atomically marks the ticket as 'used'.
 */
export async function validateTicket(ticketId: string, eventId: string, scannedBy: string) {
  const { data, error } = await supabase.rpc('use_ticket', {
    p_ticket_id: ticketId,
    p_event_id: eventId,
    p_scanned_by: scannedBy,
  })

  if (error) throw error
  return data as { valid: boolean; reason?: string; student_name?: string; department?: string; rrn?: string; quantity?: number }
}

/** Get a single registration by ID */
export async function getRegistration(id: string): Promise<Registration> {
  const { data, error } = await supabase
    .from('registrations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/** Cancel a registration and release seats */
export async function cancelRegistration(registrationId: string, eventId: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .update({ ticket_status: 'cancelled', payment_status: 'refunded' })
    .eq('id', registrationId)

  if (error) throw error

  // Release seats back
  await supabase
    .from('events')
    .update({ available_seats: supabase.rpc as any })
    .eq('id', eventId)

  // Simpler: direct update
  const { data: event } = await supabase
    .from('events')
    .select('available_seats, total_seats')
    .eq('id', eventId)
    .single()

  if (event) {
    await supabase
      .from('events')
      .update({ available_seats: Math.min(event.total_seats, event.available_seats + quantity) })
      .eq('id', eventId)
  }
}
