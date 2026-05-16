// Auto-generated Supabase types — re-run `supabase gen types` to refresh
// Hand-authored for this project until CLI is configured

export type UserRole = 'student' | 'organizer' | 'admin'
export type EventStatus = 'draft' | 'pending' | 'active' | 'approved' | 'rejected' | 'cancelled' | 'completed'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type TicketStatus = 'confirmed' | 'used' | 'cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          rrn: string | null
          name: string
          email: string
          department: string | null
          year: number | null
          phone: string | null
          bio: string | null
          role: UserRole
          college: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          date: string
          time: string
          location: string
          college: string
          category: string
          price: number
          image_url: string | null
          organizer_id: string
          organizer_name: string
          total_seats: number
          available_seats: number
          status: EventStatus
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          ticket_id: string
          quantity: number
          total_amount: number
          payment_status: PaymentStatus
          ticket_status: TicketStatus
          qr_data: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['registrations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['registrations']['Insert']>
      }
      checkins: {
        Row: {
          id: string
          registration_id: string
          scanned_by: string
          scanned_at: string
          valid: boolean
          event_id: string
        }
        Insert: Omit<Database['public']['Tables']['checkins']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['checkins']['Insert']>
      }
    }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          event_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookmarks']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['bookmarks']['Insert']>
      }
      waitlist: {
        Row: {
          id: string
          user_id: string
          event_id: string
          position: number
          notified: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['waitlist']['Row'], 'id' | 'position' | 'created_at'>
        Update: Partial<Database['public']['Tables']['waitlist']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: UserRole
      event_status: EventStatus
      payment_status: PaymentStatus
      ticket_status: TicketStatus
    }
  }
}

// Convenience row types used throughout the app
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Registration = Database['public']['Tables']['registrations']['Row']
export type Checkin = Database['public']['Tables']['checkins']['Row']
export type Bookmark = Database['public']['Tables']['bookmarks']['Row']
export type Waitlist = Database['public']['Tables']['waitlist']['Row']
