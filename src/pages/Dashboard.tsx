import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getUserRegistrations } from "@/services/registrations.service";
import { getOrganizerEvents } from "@/services/events.service";
import { QrCode, ScanLine, BarChart3, Ticket, Plus } from "lucide-react";
import { useEffect, useRef } from "react";
import QRCode from "qrcode";

// Mini inline ticket QR
const TicketQR = ({ qrData }: { qrData: string | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !qrData) return;
    QRCode.toCanvas(canvasRef.current, qrData, { width: 80, margin: 1 });
  }, [qrData]);
  if (!qrData) return <QrCode className="h-10 w-10 text-gray-300" />;
  return <canvas ref={canvasRef} className="rounded" />;
};

const Dashboard = () => {
  const { user, profile, isProfileLoading } = useAuth();
  const navigate = useNavigate();

  // Use user.role from session shim (instant) — falls back to profile.role when loaded
  const isOrganizer = user?.role === "organizer" || user?.role === "admin";

  const { data: registrations = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["my-registrations", user?.id],
    queryFn: () => getUserRegistrations(user!.id),
    enabled: !!user?.id && !isOrganizer,
  });

  const { data: myEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["my-events", user?.id],
    queryFn: () => getOrganizerEvents(user!.id),
    enabled: !!user?.id && isOrganizer,
  });

  // If user shim is somehow null (shouldn't happen behind ProtectedRoute)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-2">Could not load your profile.</p>
            <p className="text-sm text-gray-400">Try refreshing the page or signing out and back in.</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const totalRevenue = myEvents.reduce((acc, e) => {
    const sold = e.total_seats - e.available_seats;
    return acc + sold * Number(e.price);
  }, 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            {isOrganizer ? "Manage your events and track performance" : "Your tickets and bookings"}
          </p>
        </header>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {!isOrganizer && <TabsTrigger value="tickets">My Tickets</TabsTrigger>}
            {isOrganizer && <TabsTrigger value="events">My Events</TabsTrigger>}
            {isOrganizer && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hi, {(profile as any)?.name?.split(" ")[0] ?? "there"} 👋</CardTitle>
                  <CardDescription>
                    {(profile as any)?.rrn ? `RRN: ${(profile as any).rrn}` : (profile as any)?.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(profile as any)?.department && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{(profile as any).department}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge className="bg-eventx-purple capitalize">{(profile as any)?.role}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isOrganizer ? "Events Created" : "Tickets Booked"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-eventx-purple">
                    {isOrganizer ? myEvents.length : registrations.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isOrganizer ? "across all time" : "total bookings"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {isOrganizer ? (
                    <>
                      <Button className="w-full bg-eventx-purple hover:bg-eventx-dark-purple gap-2" onClick={() => navigate("/create-event")}>
                        <Plus className="h-4 w-4" /> Create Event
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full bg-eventx-purple hover:bg-eventx-dark-purple" onClick={() => navigate("/events")}>
                        Explore Events
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                        Edit Profile
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Student Tickets ─── */}
          {!isOrganizer && (
            <TabsContent value="tickets" className="mt-6">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-eventx-purple" />
                  <h3 className="font-semibold">Your Tickets</h3>
                </div>
                {ticketsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : registrations.length > 0 ? (
                  <div className="divide-y">
                    {registrations.map((reg: any) => (
                      <div key={reg.id} className="p-6 flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <TicketQR qrData={reg.qr_data} />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">{reg.event?.title}</h4>
                            <p className="text-sm text-gray-500">
                              {reg.event?.date ? formatDate(reg.event.date) : ""} · {reg.event?.location}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge className={reg.ticket_status === "confirmed" ? "bg-green-100 text-green-800" : reg.ticket_status === "used" ? "bg-gray-100 text-gray-700" : "bg-red-100 text-red-800"}>
                                {reg.ticket_status}
                              </Badge>
                              <span className="text-xs text-gray-500">{reg.quantity} ticket{reg.quantity > 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="md:text-right shrink-0">
                          <div className="font-semibold">{formatCurrency(reg.total_amount)}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{formatDate(reg.created_at)}</div>
                          <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate(`/events/${reg.event_id}`)}>
                            View Event
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <Ticket className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No tickets yet</p>
                    <Button onClick={() => navigate("/events")}>Explore Events</Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* ─── Organizer Events ─── */}
          {isOrganizer && (
            <TabsContent value="events" className="mt-6">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b flex justify-between items-center">
                  <h3 className="font-semibold">Your Events</h3>
                  <Button size="sm" className="bg-eventx-purple hover:bg-eventx-dark-purple gap-1" onClick={() => navigate("/create-event")}>
                    <Plus className="h-3.5 w-3.5" /> New Event
                  </Button>
                </div>
                {eventsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                  </div>
                ) : myEvents.length > 0 ? (
                  <div className="divide-y">
                    {myEvents.map((event) => {
                      const sold = event.total_seats - event.available_seats;
                      const fillPct = Math.round((sold / event.total_seats) * 100);
                      return (
                        <div key={event.id} className="p-6">
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            <div className="flex gap-4">
                              {event.image_url && (
                                <img src={event.image_url} alt={event.title} className="w-16 h-16 rounded-lg object-cover hidden sm:block shrink-0" />
                              )}
                              <div>
                                <h4 className="font-semibold mb-1">{event.title}</h4>
                                <p className="text-sm text-gray-500">{formatDate(event.date)} · {event.location}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <Badge className={
                                    event.status === "active" ? "bg-green-100 text-green-800" :
                                    event.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-gray-100 text-gray-700"
                                  }>{event.status}</Badge>
                                  <span className="text-xs text-gray-500">{sold}/{event.total_seats} sold ({fillPct}%)</span>
                                </div>
                              </div>
                            </div>
                            <div className="md:text-right shrink-0">
                              <div className="font-semibold text-eventx-orange">{formatCurrency(sold * Number(event.price))}</div>
                              <div className="text-xs text-gray-500">{formatCurrency(Number(event.price))}/ticket</div>
                              <div className="flex gap-2 mt-2 md:justify-end">
                                <Button variant="outline" size="sm" onClick={() => navigate(`/events/${event.id}`)}>View</Button>
                                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/scan/${event.id}`)}>
                                  <ScanLine className="h-3.5 w-3.5" /> Scan
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No events yet</p>
                    <Button onClick={() => navigate("/create-event")} className="bg-eventx-purple hover:bg-eventx-dark-purple">
                      Create Your First Event
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* ─── Analytics ─── */}
          {isOrganizer && (
            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Total Revenue</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-eventx-purple">{formatCurrency(totalRevenue)}</div>
                    <p className="text-sm text-muted-foreground mt-1">across all events</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Tickets Sold</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-eventx-purple">
                      {myEvents.reduce((a, e) => a + (e.total_seats - e.available_seats), 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Active Events</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-eventx-purple">
                      {myEvents.filter(e => e.status === "active").length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
