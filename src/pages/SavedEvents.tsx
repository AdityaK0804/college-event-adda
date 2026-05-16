import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { getBookmarks, removeBookmark } from "@/services/bookmarks.service";

const SavedEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading, isError } = useQuery({
    queryKey: ["saved-events", user?.id],
    queryFn: () => getBookmarks(user!.id),
    enabled: !!user?.id,
  });

  // Filter out any bookmarks that have null events (broken foreign key)
  const validBookmarks = bookmarks.filter((b: any) => b.event && b.event.id);

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="hover:bg-accent rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Saved Events</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {validBookmarks.length > 0 ? `${validBookmarks.length} event${validBookmarks.length !== 1 ? 's' : ''} saved` : "Events you've bookmarked"}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : isError ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">Something went wrong</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">Could not load your saved events. Please try again.</p>
            <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
          </div>
        ) : validBookmarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {validBookmarks.map((b: any) => (
              <EventCard key={b.event?.id ?? b.id} event={b.event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
              <Bookmark className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-foreground">No saved events</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Tap the heart icon on any event to save it here for quick access.
            </p>
            <Button onClick={() => navigate("/events")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Explore Events
            </Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SavedEvents;
