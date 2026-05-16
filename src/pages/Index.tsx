import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { getFeaturedEvents, getCategories } from "@/services/events.service";
import { QrCode, Search, TicketCheck, ArrowRight, Sparkles, Zap } from "lucide-react";
import CrescentLogo from "@/components/CrescentLogo";

const CATEGORY_ICONS: Record<string, string> = {
  Technical: "💻", Cultural: "🎭", Sports: "⚽", Business: "💼",
  Literary: "📚", Workshop: "🔧", Other: "🎪",
};

// Demo events — rendered if DB returns empty, so homepage NEVER looks empty
const DEMO_EVENTS = [
  { id: "demo-1", title: "HackNova 2026", date: "2026-06-15", location: "Main Auditorium", college: "B.S. Abdur Rahman Crescent Institute", category: "Technical", price: 0, image_url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80", organizer_name: "ACM Student Chapter", total_seats: 200, available_seats: 42, featured: true },
  { id: "demo-2", title: "AI Nexus Summit", date: "2026-06-22", location: "Seminar Hall B", college: "B.S. Abdur Rahman Crescent Institute", category: "Technical", price: 299, image_url: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80", organizer_name: "AI & ML Club", total_seats: 150, available_seats: 87, featured: true },
  { id: "demo-3", title: "Rhythm Night", date: "2026-07-05", location: "Open Air Theatre", college: "B.S. Abdur Rahman Crescent Institute", category: "Cultural", price: 149, image_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80", organizer_name: "Music Society", total_seats: 500, available_seats: 123, featured: true },
  { id: "demo-4", title: "Startup PitchFest", date: "2026-07-12", location: "Innovation Hub", college: "B.S. Abdur Rahman Crescent Institute", category: "Business", price: 0, image_url: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80", organizer_name: "E-Cell", total_seats: 100, available_seats: 35, featured: true },
  { id: "demo-5", title: "CyberSec Arena", date: "2026-07-20", location: "Computer Lab 3", college: "B.S. Abdur Rahman Crescent Institute", category: "Technical", price: 199, image_url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", organizer_name: "CyberSec Club", total_seats: 80, available_seats: 8, featured: false },
  { id: "demo-6", title: "Bollywood Fusion Fest", date: "2026-08-02", location: "Main Stage", college: "B.S. Abdur Rahman Crescent Institute", category: "Cultural", price: 99, image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80", organizer_name: "Cultural Committee", total_seats: 400, available_seats: 210, featured: false },
  { id: "demo-7", title: "DevSprint 48H", date: "2026-08-10", location: "IT Block", college: "B.S. Abdur Rahman Crescent Institute", category: "Technical", price: 0, image_url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80", organizer_name: "Developer Club", total_seats: 120, available_seats: 45, featured: false },
  { id: "demo-8", title: "UI/UX Bootcamp", date: "2026-08-18", location: "Design Lab", college: "B.S. Abdur Rahman Crescent Institute", category: "Workshop", price: 499, image_url: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=800&q=80", organizer_name: "Design Club", total_seats: 60, available_seats: 22, featured: false },
  { id: "demo-9", title: "Open Mic Evenings", date: "2026-08-25", location: "Canteen Area", college: "B.S. Abdur Rahman Crescent Institute", category: "Cultural", price: 0, image_url: "https://images.unsplash.com/photo-1478147427282-58a87a120781?w=800&q=80", organizer_name: "Literary Society", total_seats: 200, available_seats: 165, featured: false },
  { id: "demo-10", title: "Crescent Beats", date: "2026-09-01", location: "Sports Complex", college: "B.S. Abdur Rahman Crescent Institute", category: "Sports", price: 0, image_url: "https://images.unsplash.com/photo-1461896836934-bd45ba8c7e5a?w=800&q=80", organizer_name: "Sports Committee", total_seats: 300, available_seats: 180, featured: false },
];

const Index = () => {
  const { data: dbFeaturedEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["featured-events"],
    queryFn: getFeaturedEvents,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  });

  // If DB has featured events, show them. Otherwise show demo data so page never looks empty.
  const featuredEvents = dbFeaturedEvents.length > 0
    ? dbFeaturedEvents
    : DEMO_EVENTS.filter(e => e.featured);

  // Badge assignment logic
  const getBadge = (event: any) => {
    if (event.price === 0) return "Free";
    const avail = event.available_seats ?? event.seats?.available ?? 100;
    const total = event.total_seats ?? event.seats?.total ?? 100;
    if (avail <= 10 && avail > 0) return "Almost Full";
    if (total > 150 && avail < total * 0.5) return "Trending";
    return undefined;
  };

  // Use demo or DB categories
  const displayCategories = categories.length > 0
    ? categories
    : ["Technical", "Cultural", "Sports", "Business", "Workshop"];

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
        <div className="absolute top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 md:px-8 relative z-10 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-6 animate-fade-in">
                <Sparkles className="h-3.5 w-3.5" />
                B.S. Abdur Rahman Crescent Institute
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] text-foreground animate-fade-in" style={{ animationDelay: '0.1s' }}>
                Your campus events,<br />
                <span className="text-primary">all in one place.</span>
              </h1>
              <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-lg leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Discover, register, and attend events at Crescent. QR tickets in seconds — no paper, no queue.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 h-12 px-8 text-base">
                  <Link to="/events" className="flex items-center gap-2">
                    Explore Events <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="border-border hover:bg-accent h-12 px-8 text-base transition-all duration-300">
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 mt-10 justify-center md:justify-start animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div>
                  <div className="text-2xl font-bold text-foreground">500+</div>
                  <div className="text-xs text-muted-foreground">Events Hosted</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">5K+</div>
                  <div className="text-xs text-muted-foreground">Students</div>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <div className="text-2xl font-bold text-foreground">2s</div>
                  <div className="text-xs text-muted-foreground">Check-in</div>
                </div>
              </div>
            </div>

            <div className="md:w-1/2 md:pl-4">
              <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 ring-1 ring-border/50">
                  <img
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop"
                    alt="Campus Events"
                    className="w-full h-auto"
                    loading="eager"
                  />
                </div>
                {/* Floating card */}
                <div className="absolute -bottom-4 -left-4 bg-card rounded-xl px-4 py-3 shadow-xl ring-1 ring-border/50 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TicketCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">QR Tickets</span>
                      <span className="text-xs text-muted-foreground">Instant delivery</span>
                    </div>
                  </div>
                </div>
                {/* Another floating card */}
                <div className="absolute -top-4 -right-4 bg-card rounded-xl px-4 py-3 shadow-xl ring-1 ring-border/50 animate-slide-up hidden sm:block" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground block">Live Updates</span>
                      <span className="text-xs text-muted-foreground">Real-time seats</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Events ── */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <Badge className="bg-primary/10 text-primary border-0 mb-3">Featured</Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Don't miss out</h2>
              <p className="text-muted-foreground text-sm mt-1">Popular events happening at Crescent</p>
            </div>
            <Link to="/events" className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredEvents.map((event: any) => (
                <EventCard key={event.id} event={event} badge={getBadge(event)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-10 text-center text-foreground">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {displayCategories.map((category) => (
              <Link
                key={category}
                to={`/events?category=${category}`}
                className="bg-card rounded-xl border border-border/50 p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="text-3xl mb-3">{CATEGORY_ICONS[category] ?? "🎪"}</div>
                <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{category}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center text-foreground">How CrescentPass works</h2>
          <p className="text-muted-foreground text-center mb-14 max-w-lg mx-auto">Three simple steps to discover, register, and attend campus events.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search className="h-6 w-6 text-primary" />, title: "Discover", desc: "Browse events by category, date, or search. One place for everything on campus.", step: "01" },
              { icon: <TicketCheck className="h-6 w-6 text-primary" />, title: "Register", desc: "Book in seconds. Your profile auto-fills the form. Pay securely via UPI or card.", step: "02" },
              { icon: <QrCode className="h-6 w-6 text-primary" />, title: "Attend", desc: "Get a QR ticket instantly. Show it at the gate for a 2-second scan-in.", step: "03" },
            ].map(({ icon, title, desc, step }) => (
              <div key={title} className="relative bg-card rounded-2xl border border-border/50 p-8 text-center hover:shadow-lg transition-all duration-300 group">
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">{step}</div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">{icon}</div>
                <h3 className="text-lg font-bold mb-2 text-foreground">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-2xl md:text-4xl font-bold mb-4 text-white">Organising an event?</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto text-base">
            Create your event, manage registrations, and scan tickets — all from one dashboard.
          </p>
          <Button size="lg" asChild className="bg-white text-primary hover:bg-white/90 shadow-lg h-12 px-8 text-base">
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
