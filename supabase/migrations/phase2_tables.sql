-- ============================================================================
-- PHASE 2 — DATABASE MIGRATIONS
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add 'rejected' to event_status enum (if not already present)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'rejected'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_status')
  ) THEN
    ALTER TYPE event_status ADD VALUE 'rejected';
  END IF;
END
$$;

-- Also add 'approved' as a synonym for 'active' — we keep both for future-proofing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'approved'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_status')
  ) THEN
    ALTER TYPE event_status ADD VALUE 'approved';
  END IF;
END
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BOOKMARKS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookmarks_unique_user_event UNIQUE (user_id, event_id)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_event_id ON bookmarks(event_id);

-- RLS policies
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can read their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can add bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can remove bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. WAITLIST TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  notified    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT waitlist_unique_user_event UNIQUE (user_id, event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_event_id ON waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_event_position ON waitlist(event_id, position);

-- RLS policies
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
  ON waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- Users can join the waitlist
CREATE POLICY "Users can join waitlist"
  ON waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave the waitlist
CREATE POLICY "Users can leave waitlist"
  ON waitlist FOR DELETE
  USING (auth.uid() = user_id);

-- Organizers/admins can view waitlist for their events
CREATE POLICY "Organizers can view event waitlists"
  ON waitlist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = waitlist.event_id
        AND events.organizer_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. WAITLIST AUTO-POSITION FUNCTION
--    Automatically assigns the next position when a user joins the waitlist
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION assign_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.position := COALESCE(
    (SELECT MAX(position) FROM waitlist WHERE event_id = NEW.event_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_waitlist_position ON waitlist;
CREATE TRIGGER trg_assign_waitlist_position
  BEFORE INSERT ON waitlist
  FOR EACH ROW
  EXECUTE FUNCTION assign_waitlist_position();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. AUTO-PROMOTE FROM WAITLIST WHEN SEATS BECOME AVAILABLE
--    When available_seats increases on an event (cancellation, admin action),
--    automatically create registrations for waitlisted users.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  seats_freed integer;
  w_record RECORD;
  ticket_uuid text;
  qr_payload text;
BEGIN
  -- Only fire when available_seats increased
  IF NEW.available_seats <= OLD.available_seats THEN
    RETURN NEW;
  END IF;

  seats_freed := NEW.available_seats - OLD.available_seats;

  -- Process waitlist entries in FIFO order (by position)
  FOR w_record IN
    SELECT * FROM waitlist
    WHERE event_id = NEW.id
      AND notified = false
    ORDER BY position ASC
    LIMIT seats_freed
  LOOP
    -- Generate ticket
    ticket_uuid := gen_random_uuid()::text;
    qr_payload := json_build_object(
      'ticket_id', ticket_uuid,
      'event_id', NEW.id,
      'user_id', w_record.user_id,
      'v', 1
    )::text;

    -- Create confirmed registration (free — waitlist doesn't handle payment)
    INSERT INTO registrations (
      event_id, user_id, ticket_id, quantity,
      total_amount, payment_status, ticket_status, qr_data
    ) VALUES (
      NEW.id, w_record.user_id, ticket_uuid, 1,
      NEW.price, CASE WHEN NEW.price = 0 THEN 'paid' ELSE 'pending' END,
      'confirmed', qr_payload
    );

    -- Decrement available seats
    NEW.available_seats := NEW.available_seats - 1;

    -- Mark waitlist entry as notified (will be cleaned up)
    UPDATE waitlist SET notified = true WHERE id = w_record.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_promote_waitlist ON events;
CREATE TRIGGER trg_promote_waitlist
  BEFORE UPDATE OF available_seats ON events
  FOR EACH ROW
  EXECUTE FUNCTION promote_from_waitlist();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ADMIN RLS — Allow admins to update event status
-- ─────────────────────────────────────────────────────────────────────────────
-- Admins can update any event (for approval/rejection)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'events' AND policyname = 'Admins can update events'
  ) THEN
    CREATE POLICY "Admins can update events"
      ON events FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END
$$;

-- Admins can view all events (including pending/rejected)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'events' AND policyname = 'Admins can view all events'
  ) THEN
    CREATE POLICY "Admins can view all events"
      ON events FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
      );
  END IF;
END
$$;
