import { supabase } from '@/lib/supabase'
import type { Event } from '@/lib/database.types'

export interface EventFilters {
  category?: string
  search?: string
  priceRange?: 'free' | 'under500' | '500to1000' | 'above1000'
  college?: string
}

/** Fetch active events with optional filters */
export async function getEvents(filters: EventFilters = {}): Promise<Event[]> {
  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .order('date', { ascending: true })

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.college && filters.college !== 'all') {
    query = query.eq('college', filters.college)
  }

  if (filters.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,college.ilike.%${filters.search}%`
    )
  }

  if (filters.priceRange) {
    switch (filters.priceRange) {
      case 'free':
        query = query.eq('price', 0)
        break
      case 'under500':
        query = query.gt('price', 0).lt('price', 500)
        break
      case '500to1000':
        query = query.gte('price', 500).lte('price', 1000)
        break
      case 'above1000':
        query = query.gt('price', 1000)
        break
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

/** Fetch featured events for homepage */
export async function getFeaturedEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .order('date', { ascending: true })
    .limit(6)

  if (error) throw error
  return data ?? []
}

/** Fetch single event by ID */
export async function getEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/** Fetch completed events (past events) */
export async function getPastEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'completed')
    .order('date', { ascending: false })
    .limit(20)

  if (error) throw error
  return data ?? []
}

/** Fetch events created by a specific organizer */
export async function getOrganizerEvents(organizerId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export interface CreateEventData {
  title: string
  description: string
  date: string
  time: string
  location: string
  college: string
  category: string
  price: number
  image_url?: string
  total_seats: number
  organizer_id: string
  organizer_name: string
}

/** Create a new event (starts as 'pending', admin must approve) */
export async function createEvent(data: CreateEventData): Promise<Event> {
  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...data,
      available_seats: data.total_seats,
      status: 'pending',
      featured: false,
    })
    .select()
    .single()

  if (error) throw error
  return event
}

/** Update an existing event (organizer only) */
export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/** Get unique categories from active events */
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('category')
    .eq('status', 'active')

  if (error) throw error
  return [...new Set((data ?? []).map((e) => e.category))].sort()
}
