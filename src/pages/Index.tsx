import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { getFeaturedEvents, getCategories } from "@/services/events.service";
import { QrCode, Search, TicketCheck } from "lucide-react";

const CATEGORY_ICONS: Record<string, string> = {
  Technical: "💻", Cultural: "🎭", Sports: "⚽", Business: "💼",
  Literary: "📚", Workshop: "🔧", Other: "🎪",
};

const Index = () => {
  const { data: featuredEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["featured-events"],
    queryFn: getFeaturedEvents,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-r from-eventx-purple to-eventx-dark-purple text-white py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <Badge className="bg-white/15 text-white border-0 mb-4 text-xs">
                B.S. Abdur Rahman Crescent Institute
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Your campus events,<br />all in one place.
              </h1>
              <p className="text-lg mb-6 text-white/75 max-w-md">
                Discover, register, and attend events at Crescent. QR tickets in seconds — no paper, no queue.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-eventx-orange hover:bg-eventx-orange/90 text-white" asChild>
                  <Link to="/events">Explore Events</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white hover:text-eventx-purple" asChild>
                  <Link to="/register">Create Account</Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 md:pl-8">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800&auto=format&fit=crop"
                  alt="Campus Events"
                  className="w-full h-auto"
                  loading="eager"
                />
                <div className="absolute bottom-4 left-4 bg-white rounded-lg px-3 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <TicketCheck className="h-4 w-4 text-eventx-purple" />
                    <span className="text-sm font-semibold text-gray-800">QR tickets · Instant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Featured Events</h2>
              <p className="text-gray-500 text-sm mt-1">Happening at Crescent</p>
            </div>
            <Link to="/events" className="text-eventx-purple hover:underline font-medium text-sm">
              View All →
            </Link>
          </div>
          {eventsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {featuredEvents.map((event) => <EventCard key={event.id} event={event as any} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">No featured events yet. Check back soon!</p>
              <Button variant="outline" asChild><Link to="/events">Browse All Events</Link></Button>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/events?category=${category}`}
                  className="bg-white rounded-xl shadow-sm p-5 text-center hover:shadow-md transition-all hover:-translate-y-0.5 group"
                >
                  <div className="text-3xl mb-2">{CATEGORY_ICONS[category] ?? "🎪"}</div>
                  <h3 className="font-semibold text-sm group-hover:text-eventx-purple transition-colors">{category}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">How Crescent Pass works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search className="h-7 w-7 text-eventx-purple" />, title: "Discover", desc: "Browse events by category, date, or search. One place for everything on campus." },
              { icon: <TicketCheck className="h-7 w-7 text-eventx-purple" />, title: "Register", desc: "Book in seconds. Your profile auto-fills the form. Pay securely via UPI or card." },
              { icon: <QrCode className="h-7 w-7 text-eventx-purple" />, title: "Attend", desc: "Get a QR ticket instantly. Show it at the gate for a 2-second scan-in." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="bg-eventx-light-purple rounded-2xl p-4 mb-4">{icon}</div>
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 bg-eventx-purple">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Organising an event?</h2>
          <p className="text-white/75 mb-6 max-w-md mx-auto text-sm">
            Create your event, manage registrations, and scan tickets — all from one dashboard.
          </p>
          <Button size="lg" className="bg-white text-eventx-purple hover:bg-white/90" asChild>
            <Link to="/register">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
