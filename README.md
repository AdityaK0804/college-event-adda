# CrescentPass / EventX 

A modern full-stack college event management platform built for students, organisers, and campus communities.

CrescentPass helps colleges manage technical fests, workshops, cultural programs, sports tournaments, hackathons, and student activities through a centralized digital platform with QR tickets, analytics, event discovery, dashboards, and real-time updates.

Live Demo: https://crescent-event-x.vercel.app/
---

#  Features

##  Student Features

* Browse upcoming college events
* Filter events by category and price
* Bookmark / Save events
* Register for events instantly
* QR-based digital tickets
* Download PDF tickets
* View activity dashboard
* Earn achievement badges
* Download participation certificates
* Real-time seat updates
* Promo code support
* Dark mode / Light mode support

---

##  Organiser Features

* Create and manage events
* Edit existing events
* View organiser dashboard
* Track registrations and seat fills
* Access attendee lists
* Export attendees as CSV
* Generate certificates
* Create promo codes
* Real-time analytics dashboard
* QR scanner for event check-in

---

##  Admin Features

* Approve or reject events
* View platform analytics
* Monitor users and organisers
* Manage featured events
* Moderate event listings

---

# 🚀 Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* Framer Motion
* Recharts
* jsPDF
* html2canvas

---

## Backend & Database

* Supabase
* PostgreSQL
* Supabase Auth
* Row Level Security (RLS)
* Supabase Realtime
* Supabase Edge Functions

---

## Payments

* Razorpay Integration
* Webhook verification
* Secure payment validation

---

# 📸 Major Systems Implemented

## ✅ Authentication System

* Student login/signup
* Organiser accounts
* Session persistence
* Protected routes
* Role-based access
* Profile management

---

## ✅ Event Management

* Create events
* Event categories
* Featured events
* Seat management
* Event editing
* Real-time availability

---

## ✅ QR Ticket System

Each registration generates:

* Unique ticket
* QR code
* Ticket ID
* PDF export
* Check-in validation

---

## ✅ Waitlist System

When events become full:

* Students can join waitlists
* Automatic promotion when seats free up
* Real-time updates

---

## ✅ Analytics Dashboard

Organisers can view:

* Registration trends
* Department breakdown
* Seat fill progress
* Revenue stats
* Check-in analytics

---

## ✅ Activity & Badge System

Students receive badges such as:

* First Timer
* Techie
* Culture Vulture
* All-Rounder
* Veteran

---

## ✅ Bookmarking System

Students can:

* Save interesting events
* Access them later from dashboard
* Build personal event collections

---

## ✅ Certificate Generation

* PDF certificates
* Downloadable instantly
* Generated client-side
* Verification IDs included

---

## ✅ Promo Code System

Supports:

* Percentage discounts
* Flat discounts
* Expiry dates
* Usage limits
* Validation functions

---

# 📱 UI / UX Features

* Fully responsive design
* Mobile bottom navigation
* Modern dashboard UI
* Dark mode / Light mode
* Smooth transitions
* Realtime updates
* Optimized loading states
* Modern event cards

---

# 🗂️ Project Structure

```bash
src/
├── components/
├── pages/
├── services/
├── contexts/
├── hooks/
├── lib/
├── data/
├── supabase/
└── assets/
```

---

# ⚙️ Installation & Setup

## 1. Clone Repository

```bash
git clone https://github.com/your-username/crescentpass.git
cd crescentpass
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Setup Environment Variables

Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

---

## 4. Run Supabase SQL Schemas

Run all schema files inside:

```bash
supabase/
```

Including:

* schema.sql
* phase2-schema.sql
* phase3-schema.sql

---

## 5. Start Development Server

```bash
npm run dev
```

---

## 6. Production Build

```bash
npm run build
```

---

# 🔒 Security Features

* Supabase Row Level Security
* Protected API access
* Razorpay webhook verification
* Role-based route guards
* Session validation
* Secure promo validation

---

# 🌟 Future Scope

## Planned Phase 4 Features

* Multi-college support
* AI event recommendations
* Event feed personalization
* React Native mobile app
* Push notifications
* AI chatbot assistant
* Smart networking system
* Attendance heatmaps
* Resume-integrated certificates

---

# 🧪 Demo Event Categories

* Technical
* Cultural
* Sports
* Business
* Workshops
* Hackathons
* Networking
* Music Shows

---

# 🎯 Project Goals

The goal of CrescentPass is to replace fragmented college event management systems like:

* WhatsApp groups
* Google Forms
* Excel sheets
* Offline registrations
* Manual ticket verification

with a centralized, modern, scalable platform.

---

# 👨‍💻 Developed By

**Aditya Kumar**

Full Stack Developer

Built using React, TypeScript, Supabase, and modern frontend architecture.

---

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you like this project:

* Star the repository ⭐
* Fork the project 🍴
* Share feedback 💬

---

# 📬 Contact

For collaborations or queries:

📧 [support@eventx.in](mailto:support@eventx.in)

---

# 🏁 Final Note

CrescentPass/EventX was built to create a smarter and more engaging campus event ecosystem where students can discover opportunities, organisers can manage events efficiently, and colleges can modernize the entire event experience.

