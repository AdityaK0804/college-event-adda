import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, User, BadgeIndianRupee, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { RegistrationForm } from "@/components/RegistrationForm";
import { getEvent } from "@/services/events.service";
import { createRegistration } from "@/services/registrations.service";
import TicketConfirmModal from "@/components/TicketConfirmModal";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID;

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user, profile } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [confirmedRegistration, setConfirmedRegistration] = useState<any>(null);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  if (isLoading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <Skeleton className="w-full h-72 rounded-lg mb-6" />
            <Skeleton className="h-8 w-2/3 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-2" />
          </div>
          <div className="lg:w-1/3"><Skeleton className="h-64 w-full rounded-lg" /></div>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (isError || !event) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Event not found</h1>
        <p className="mb-8 text-gray-600">This event may have been removed or doesn't exist.</p>
        <Button onClick={() => navigate("/events")}>Browse Events</Button>
      </div>
      <Footer />
    </div>
  );

  const availabilityPct = (event.available_seats / event.total_seats) * 100;
  const barColor = availabilityPct <= 20 ? "bg-red-500" : availabilityPct <= 50 ? "bg-yellow-500" : "bg-green-500";
  const soldOut = event.available_seats === 0;

  const handleBookTickets = () => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to book tickets", variant: "destructive" });
      navigate("/login?redirect=" + encodeURIComponent(`/events/${id}`));
      return;
    }
    setShowRegistrationForm(true);
  };

  const handleRegistrationSubmit = async () => {
    if (!user || !event) return;

    const totalAmount = event.price * quantity;

    // Free event — skip payment, create registration directly
    if (totalAmount === 0) {
      try {
        const reg = await createRegistration({
          eventId: event.id,
          userId: user.id,
          quantity,
          totalAmount: 0,
        });
        setShowRegistrationForm(false);
        setConfirmedRegistration(reg);
      } catch (err: any) {
        toast({ title: err?.message ?? "Registration failed", variant: "destructive" });
      }
      return;
    }

    // Paid event — open Razorpay
    if (!RAZORPAY_KEY) {
      toast({ title: "Payment not configured. Contact admin.", variant: "destructive" });
      return;
    }

    // Dynamically load Razorpay script
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      await new Promise((res) => { script.onload = res; });
    }

    // Create a pending registration first (seats reserved)
    let pendingReg: any;
    try {
      pendingReg = await createRegistration({
        eventId: event.id,
        userId: user.id,
        quantity,
        totalAmount,
      });
    } catch (err: any) {
      toast({ title: err?.message ?? "Could not reserve seats", variant: "destructive" });
      return;
    }

    const options = {
      key: RAZORPAY_KEY,
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      name: "Crescent Pass",
      description: `${quantity} ticket(s) for ${event.title}`,
      image: "/logo.png",
      handler: async (response: any) => {
        // Payment successful — update registration
        const { error } = await import("@supabase/supabase-js").then(() =>
          import("@/lib/supabase")
        ).then(({ supabase }) =>
          supabase.from("registrations").update({
            payment_status: "paid",
            razorpay_payment_id: response.razorpay_payment_id,
          }).eq("id", pendingReg.id)
        );

        if (error) {
          toast({ title: "Payment recorded but ticket update failed. Contact support.", variant: "destructive" });
          return;
        }

        setShowRegistrationForm(false);
        setConfirmedRegistration({ ...pendingReg, razorpay_payment_id: response.razorpay_payment_id, payment_status: "paid" });
        toast({ title: "Payment successful! Your ticket is confirmed." });
      },
      prefill: {
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        contact: (profile as any)?.phone ?? "",
      },
      theme: { color: "#8B5CF6" },
      modal: {
        ondismiss: async () => {
          // Payment cancelled — release seats
          const { supabase } = await import("@/lib/supabase");
          await supabase.from("registrations").update({ payment_status: "failed", ticket_status: "cancelled" }).eq("id", pendingReg.id);
          await supabase.from("events").update({ available_seats: event.available_seats + quantity }).eq("id", event.id);
          toast({ title: "Payment cancelled. Seats released." });
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: event.title, url }).catch(() => null);
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const imageUrl = event.image_url ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="lg:w-2/3">
            <div className="rounded-lg overflow-hidden mb-6">
              <img src={imageUrl} alt={event.title} className="w-full h-auto object-cover" loading="lazy" />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
                <Badge className="bg-eventx-purple shrink-0">{event.category}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>{event.location}, {event.college}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 shrink-0" />
                  <span>Organised by {event.organizer_name}</span>
                </div>
              </div>
              <Separator className="my-6" />
              <div>
                <h2 className="text-xl font-bold mb-4">About This Event</h2>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{event.description}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              {showRegistrationForm ? (
                <RegistrationForm
                  onSubmit={handleRegistrationSubmit}
                  onCancel={() => setShowRegistrationForm(false)}
                  eventTitle={event.title}
                  quantity={quantity}
                  totalAmount={event.price * quantity}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Book Tickets</h3>
                    <div className="flex items-center gap-1">
                      <BadgeIndianRupee className="h-5 w-5 text-eventx-orange" />
                      <span className="text-2xl font-bold text-eventx-orange">
                        {event.price === 0 ? "Free" : formatCurrency(event.price)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-1">
                      {soldOut ? "Sold out" : `${event.available_seats} / ${event.total_seats} seats available`}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`${barColor} h-2 rounded-full`} style={{ width: `${availabilityPct}%` }} />
                    </div>
                    {event.available_seats <= 10 && !soldOut && (
                      <p className="text-xs text-red-600 mt-1 font-medium">Only {event.available_seats} left!</p>
                    )}
                  </div>

                  {!soldOut && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">Number of Tickets</label>
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1}>−</Button>
                        <span className="font-medium w-8 text-center text-lg">{quantity}</span>
                        <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(event.available_seats, quantity + 1))} disabled={quantity >= event.available_seats}>+</Button>
                      </div>
                    </div>
                  )}

                  {!soldOut && (
                    <div className="mb-4 border rounded-lg p-3 bg-gray-50 text-sm">
                      <div className="flex justify-between py-1"><span className="text-gray-600">Price per ticket</span><span>{formatCurrency(event.price)}</span></div>
                      <div className="flex justify-between py-1"><span className="text-gray-600">Quantity</span><span>{quantity}</span></div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold"><span>Total</span><span>{event.price === 0 ? "Free" : formatCurrency(event.price * quantity)}</span></div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-eventx-purple hover:bg-eventx-dark-purple mb-3"
                    onClick={handleBookTickets}
                    disabled={soldOut}
                  >
                    {soldOut ? "Sold Out" : "Book Now"}
                  </Button>

                  <Button variant="outline" className="w-full flex items-center gap-2" onClick={handleShare}>
                    <Share2 className="h-4 w-4" /> Share Event
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {confirmedRegistration && (
        <TicketConfirmModal
          registration={confirmedRegistration}
          event={event}
          onClose={() => setConfirmedRegistration(null)}
        />
      )}
    </div>
  );
};

export default EventDetail;
