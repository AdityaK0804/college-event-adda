import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addBookmark, removeBookmark, isBookmarked } from "@/services/bookmarks.service";

// Accepts both Supabase Event rows and the legacy mock shape
interface EventCardProps {
  event: {
    id: string;
    title: string;
    date: string;
    location: string;
    college: string;
    category: string;
    price: number;
    image_url?: string | null;
    image?: string;              // legacy mock field
    organizer_name?: string;
    organizerName?: string;      // legacy mock field
    total_seats?: number;
    available_seats?: number;
    seats?: { total: number; available: number }; // legacy mock field
    featured?: boolean;
  };
  /** Optional badge to display (e.g., "Trending", "Almost Full") */
  badge?: string;
}

const EventCard = ({ event, badge }: EventCardProps) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const imageUrl = event.image_url ?? event.image ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800";
  const organizerName = event.organizer_name ?? event.organizerName ?? "";
  const totalSeats = event.total_seats ?? event.seats?.total ?? 100;
  const availableSeats = event.available_seats ?? event.seats?.available ?? 100;

  const pct = totalSeats > 0 ? (availableSeats / totalSeats) * 100 : 100;
  const barColor = pct <= 20 ? "bg-red-500" : pct <= 50 ? "bg-amber-500" : "bg-emerald-500";
  const urgency = availableSeats <= 10 && availableSeats > 0;
  const soldOut = availableSeats === 0;

  // Bookmark state
  const bookmarkKey = ["bookmark", user?.id, event.id];
  const { data: bookmarked = false } = useQuery({
    queryKey: bookmarkKey,
    queryFn: () => isBookmarked(user!.id, event.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const toggleBookmark = useMutation({
    mutationFn: async () => {
      if (!user) return;
      if (bookmarked) {
        await removeBookmark(user.id, event.id);
      } else {
        await addBookmark(user.id, event.id);
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: bookmarkKey });
      queryClient.setQueryData(bookmarkKey, !bookmarked);
      // Optimistic: update saved-events cache too
      if (bookmarked) {
        queryClient.setQueryData(["saved-events", user?.id], (old: any[] | undefined) =>
          (old ?? []).filter((b: any) => b.event?.id !== event.id && b.event_id !== event.id)
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: bookmarkKey });
      queryClient.invalidateQueries({ queryKey: ["saved-events", user?.id] });
    },
  });

  // Smart badge logic
  const showBadge = badge || (event.price === 0 ? "Free" : urgency ? "Almost Full" : null);

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group bg-card border-border/50">
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        <Badge className="absolute top-3 right-3 bg-primary/90 text-primary-foreground backdrop-blur-sm border-0 text-xs">
          {event.category}
        </Badge>
        
        {isAuthenticated && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark.mutate(); }}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-200 shadow-sm hover:shadow-md"
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Heart className={`h-4 w-4 transition-all duration-200 ${bookmarked ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"}`} />
          </button>
        )}
        
        {showBadge && (
          <Badge className={`absolute top-3 left-3 text-xs font-medium backdrop-blur-sm border-0 ${
            showBadge === "Free" ? "bg-emerald-500/90 text-white" :
            showBadge === "Almost Full" ? "bg-red-500/90 text-white" :
            showBadge === "Trending" ? "bg-amber-500/90 text-white" :
            "bg-primary/90 text-primary-foreground"
          }`}>
            {showBadge === "Almost Full" ? `Only ${availableSeats} left!` : showBadge}
          </Badge>
        )}
        
        {soldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-background text-foreground text-sm px-4 py-1">Sold Out</Badge>
          </div>
        )}
      </div>

      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base font-semibold line-clamp-1 flex-1 text-foreground">{event.title}</h3>
          <span className="font-bold text-primary whitespace-nowrap text-sm">
            {event.price === 0 ? "Free" : `₹${event.price}`}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground line-clamp-1">{event.college}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(event.date)}</span>
        </div>
        {organizerName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{organizerName}</span>
          </div>
        )}
        <div className="pt-1">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{availableSeats}/{totalSeats} seats</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className={`${barColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 pb-4">
        <Button
          asChild
          className={`w-full text-sm transition-all duration-200 ${soldOut ? "opacity-60 cursor-not-allowed" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md"}`}
          disabled={soldOut}
        >
          <Link to={`/events/${event.id}`}>{soldOut ? "Sold Out" : "Book Now"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
