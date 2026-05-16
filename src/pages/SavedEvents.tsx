import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import EventCardSkeleton from "@/components/EventCardSkeleton";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/useAuth";
import { getBookmarks, removeBookmark } from "@/services/bookmarks.service";

const SavedEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["saved-events", user?.id],
    queryFn: () => getBookmarks(user!.id),
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Saved Events</h1>
            <p className="text-gray-600">Events you've bookmarked</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {bookmarks.map((b: any) => (
              <EventCard key={b.event?.id ?? b.id} event={b.event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No saved events</h3>
            <p className="text-gray-600 mb-6">Tap the heart icon on any event to save it here</p>
            <Button onClick={() => navigate("/events")} className="bg-eventx-purple hover:bg-eventx-dark-purple">
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
