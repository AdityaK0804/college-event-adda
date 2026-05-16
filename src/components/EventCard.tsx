import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";

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
  };
}

const EventCard = ({ event }: EventCardProps) => {
  const imageUrl = event.image_url ?? event.image ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800";
  const organizerName = event.organizer_name ?? event.organizerName ?? "";
  const totalSeats = event.total_seats ?? event.seats?.total ?? 100;
  const availableSeats = event.available_seats ?? event.seats?.available ?? 100;

  const pct = totalSeats > 0 ? (availableSeats / totalSeats) * 100 : 100;
  const barColor = pct <= 20 ? "bg-red-500" : pct <= 50 ? "bg-yellow-500" : "bg-green-500";
  const urgency = availableSeats <= 10 && availableSeats > 0;
  const soldOut = availableSeats === 0;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <Badge className="absolute top-2 right-2 bg-eventx-purple">{event.category}</Badge>
        {urgency && !soldOut && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
            Only {availableSeats} left!
          </Badge>
        )}
        {soldOut && (
          <Badge className="absolute top-2 left-2 bg-gray-800 text-white text-xs">
            Sold Out
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-base font-semibold line-clamp-1 flex-1">{event.title}</h3>
          <span className="font-bold text-eventx-orange whitespace-nowrap text-sm">
            {event.price === 0 ? "Free" : `₹${event.price}`}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1">{event.college}</p>
      </CardHeader>

      <CardContent className="space-y-1.5 pb-0">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(event.date)}</span>
        </div>
        {organizerName && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{organizerName}</span>
          </div>
        )}
        <div className="pt-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{availableSeats}/{totalSeats} seats</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          asChild
          className={`w-full text-sm ${soldOut ? "opacity-60 cursor-not-allowed" : "bg-eventx-purple hover:bg-eventx-dark-purple"}`}
          disabled={soldOut}
        >
          <Link to={`/events/${event.id}`}>{soldOut ? "Sold Out" : "Book Now"}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
