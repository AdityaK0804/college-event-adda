import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { getPastEvents } from "@/services/events.service";
import { Clock } from "lucide-react";

const PastEvents = () => {
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ["past-events"],
    queryFn: getPastEvents,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Past Events</h1>
          <p className="text-muted-foreground mt-1">Relive the events that shaped campus life</p>
        </header>

        {isError ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Could not load past events. Please try again.</p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => <EventCard key={event.id} event={event as any} />)}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">No past events yet</h3>
            <p className="text-muted-foreground">Check back after events have concluded.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PastEvents;
