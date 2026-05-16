# Crescent Pass — Phase 1 Setup Guide

## What's been implemented

### Architecture
- **Real backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Real authentication**: Email/password with RRN-based profiles, JWT sessions, role-based access
- **Real database**: 4 tables (profiles, events, registrations, checkins) with atomic seat reservation
- **Real payments**: Razorpay integration with proper payment lifecycle
- **Real QR tickets**: Signed payload generated on registration, downloadable PNG
- **Real scanning**: Camera-based QR validation with duplicate prevention and atomic DB update
- **Code splitting**: 20+ lazy-loaded chunks — scanner loads only when organiser opens scanner page
- **Loading states**: Skeleton screens on all list/detail pages — no blank flashes

### Files changed
```
src/
├── App.tsx                         ← lazy routes, ProtectedRoute, code splitting
├── contexts/AuthContext.tsx        ← real Supabase auth, profile loading
├── services/
│   ├── auth.service.ts             ← signUp, signIn, getProfile, updateProfile
│   ├── events.service.ts           ← getEvents, getEvent, createEvent, getFeatured...
│   └── registrations.service.ts   ← createRegistration (atomic), validateTicket (atomic)
├── lib/
│   ├── supabase.ts                 ← singleton client
│   └── database.types.ts          ← full TypeScript types
├── components/
│   ├── ProtectedRoute.tsx          ← guards auth + role-required routes
│   ├── EventCard.tsx               ← accepts Supabase shape, urgency bar, lazy images
│   ├── EventCardSkeleton.tsx       ← skeleton for list pages
│   ├── RegistrationForm.tsx        ← auto-fills from profile (RRN, dept, name)
│   ├── TicketConfirmModal.tsx      ← real QR canvas, download button
│   └── Navbar.tsx                  ← async logout, sticky, CrescentPass branding
└── pages/
    ├── Index.tsx                   ← real featured events + categories from DB
    ├── Events.tsx                  ← real queries, debounced search, filter badges
    ├── EventDetail.tsx             ← real data, Razorpay checkout, free event flow
    ├── Dashboard.tsx               ← student tickets with QR / organiser events
    ├── CreateEvent.tsx             ← real CRUD, pending approval workflow
    ├── PastEvents.tsx              ← real past events query
    ├── Profile.tsx                 ← real profile update
    ├── Login.tsx                   ← real Supabase auth
    ├── Register.tsx                ← RRN + department fields
    └── Scanner.tsx                 ← camera QR scanner, atomic validation, sound feedback

supabase/
└── schema.sql                      ← complete schema with RLS + atomic DB functions
```

---

## Step-by-step setup

### 1. Create a Supabase project
1. Go to https://supabase.com → New Project
2. Copy your **Project URL** and **Anon Key** from Settings → API

### 2. Run the database schema
1. Open Supabase Dashboard → SQL Editor
2. Paste the contents of `supabase/schema.sql`
3. Run it — all tables, functions, and RLS policies are created

### 3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 4. Set up Razorpay (optional for Phase 1 testing)
1. Create account at https://razorpay.com
2. Dashboard → Settings → API Keys → Generate Test Key
3. Copy the Key ID into `VITE_RAZORPAY_KEY_ID`
4. For webhook verification (production), add a server function — see notes below

### 5. Run locally
```bash
npm install
npm run dev
```

### 6. Create your first organiser account
1. Register at `/register` with role = "Event Organizer"
2. In Supabase Dashboard → Table Editor → profiles
3. Find your row, change `role` to `organizer`
4. Now you can create events at `/create-event`

### 7. Approve events (admin workflow)
Events start as `pending`. To activate:
- Supabase Dashboard → Table Editor → events
- Change `status` from `pending` to `active`
- (Phase 2 will add an admin panel for this)

### 8. Deploy
```bash
# Frontend — deploy to Vercel (free)
npm run build
# Connect your repo at vercel.com, it auto-detects Vite
# Add environment variables in Vercel project settings
```

---

## Security notes

### What's protected
- **Route guards**: `/dashboard`, `/profile`, `/create-event`, `/scan/:id` require auth
- **Role guards**: `/create-event` and `/scan/:id` require organiser or admin role
- **DB functions**: seat reservation and ticket validation are atomic (SELECT FOR UPDATE)
- **RLS policies**: users can only read/write their own data
- **QR payload**: signed JSON; server validates ticket_id exists in DB before marking used

### What to add for production
1. **Razorpay webhook server**: Currently payment is confirmed client-side. For production:
   - Create a Supabase Edge Function (`supabase/functions/razorpay-webhook/`)
   - Verify `razorpay-signature` header with HMAC-SHA256
   - Only then update `payment_status = 'paid'`
2. **Email notifications**: Use Resend or Supabase's built-in SMTP to send ticket emails
3. **HMAC-signed QR codes**: Add a server secret to the QR payload and verify it in `use_ticket()`

---

## Phase 2 roadmap (next)
- WhatsApp notification via Twilio/Wati after booking
- PDF ticket download (client-side via jsPDF)
- Waitlist system for sold-out events
- Admin panel to approve/reject events
- Organiser attendee list (searchable, exportable CSV)
- Offline scanner mode (IndexedDB cache)
- Event calendar view
- Department-based event recommendations
