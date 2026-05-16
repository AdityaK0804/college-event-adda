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
import { QrCode, ScanLine, BarChart3, Ticket, Plus, Download, TrendingUp, CalendarDays, Bookmark } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// Lazy PDF download helper — keeps jsPDF out of initial bundle
const downloadTicketPDF = async (reg: any, userName: string) => {
  const { generateTicketPDF } = await import("@/lib/ticket-pdf");
  const { formatDate } = await import("@/lib/utils");
  await generateTicketPDF({
    ticketId: reg.ticket_id,
    eventTitle: reg.event?.title ?? "Event",
    eventDate: reg.event?.date ? formatDate(reg.event.date) : "",
    eventTime: reg.event?.time ?? "",
    venue: reg.event?.location ?? "",
    college: reg.event?.college ?? "",
    category: reg.event?.category ?? "",
    studentName: userName,
    quantity: reg.quantity,
    qrData: reg.qr_data,
  });
};

// Mini inline ticket QR
const TicketQR = ({ qrData }: { qrData: string | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current || !qrData) return;
    QRCode.toCanvas(canvasRef.current, qrData, { width: 80, margin: 1 });
  }, [qrData]);
  if (!qrData) return <QrCode className="h-10 w-10 text-muted-foreground/30" />;
  return <canvas ref={canvasRef} className="rounded" />;
};

const Dashboard = () => {
  const { user, profile, isProfileLoading } = useAuth();
  const navigate = useNavigate();

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Could not load your profile.</p>
            <p className="text-sm text-muted-foreground/70">Try refreshing the page or signing out and back in.</p>
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
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {isOrganizer ? "Manage your events and track performance" : "Your tickets and bookings"}
          </p>
        </header>

        <Tabs defaultValue="overview">
          <TabsList className="bg-muted">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {!isOrganizer && <TabsTrigger value="tickets">My Tickets</TabsTrigger>}
            {isOrganizer && <TabsTrigger value="events">My Events</TabsTrigger>}
            {isOrganizer && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          {/* ─── Overview ─── */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Hi, {(profile as any)?.name?.split(" ")[0] ?? "there"} 👋</CardTitle>
                  <CardDescription>
                    {(profile as any)?.rrn ? `RRN: ${(profile as any).rrn}` : (profile as any)?.email}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {(profile as any)?.department && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium text-foreground">{(profile as any).department}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge className="bg-primary/10 text-primary border-0 capitalize">{(profile as any)?.role}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">{isOrganizer ? "Events Created" : "Tickets Booked"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    {isOrganizer ? myEvents.length : registrations.length}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isOrganizer ? "across all time" : "total bookings"}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {isOrganizer ? (
                    <>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2" onClick={() => navigate("/create-event")}>
                        <Plus className="h-4 w-4" /> Create Event
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => navigate("/profile")}>
                        Edit Profile
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => navigate("/events")}>
                        Explore Events
                      </Button>
                      <Button variant="outline" className="w-full gap-2" onClick={() => navigate("/dashboard/saved")}>
                        <Bookmark className="h-4 w-4" /> Saved Events
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
              <Card className="border-border/50">
                <div className="px-6 py-4 border-b border-border flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Your Tickets</h3>
                </div>
                {ticketsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                  </div>
                ) : registrations.length > 0 ? (
                  <div className="divide-y divide-border">
                    {registrations.map((reg: any) => (
                      <div key={reg.id} className="p-6 flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="shrink-0">
                            <TicketQR qrData={reg.qr_data} />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1 text-foreground">{reg.event?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {reg.event?.date ? formatDate(reg.event.date) : ""} · {reg.event?.location}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge className={
                                reg.ticket_status === "confirmed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" :
                                reg.ticket_status === "used" ? "bg-muted text-muted-foreground border-0" :
                                "bg-red-500/10 text-red-600 dark:text-red-400 border-0"
                              }>
                                {reg.ticket_status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{reg.quantity} ticket{reg.quantity > 1 ? "s" : ""}</span>
                            </div>
                          </div>
                        </div>
                        <div className="md:text-right shrink-0">
                          <div className="font-semibold text-foreground">{formatCurrency(reg.total_amount)}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{formatDate(reg.created_at)}</div>
                          <div className="flex gap-2 mt-2 md:justify-end">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/events/${reg.event_id}`)}>
                              View Event
                            </Button>
                            {reg.ticket_status === "confirmed" && (
                              <Button
                                variant="outline" size="sm" className="gap-1"
                                onClick={() => downloadTicketPDF(reg, user?.name ?? "Attendee")}
                              >
                                <Download className="h-3.5 w-3.5" /> PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Ticket className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground mb-4">No tickets yet</p>
                    <Button onClick={() => navigate("/events")} className="bg-primary hover:bg-primary/90 text-primary-foreground">Explore Events</Button>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          {/* ─── Organizer Events ─── */}
          {isOrganizer && (
            <TabsContent value="events" className="mt-6">
              <Card className="border-border/50">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                  <h3 className="font-semibold text-foreground">Your Events</h3>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1" onClick={() => navigate("/create-event")}>
                    <Plus className="h-3.5 w-3.5" /> New Event
                  </Button>
                </div>
                {eventsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1,2].map(i => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
                  </div>
                ) : myEvents.length > 0 ? (
                  <div className="divide-y divide-border">
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
                                <h4 className="font-semibold mb-1 text-foreground">{event.title}</h4>
                                <p className="text-sm text-muted-foreground">{formatDate(event.date)} · {event.location}</p>
                                <div className="mt-1.5 flex items-center gap-2">
                                  <Badge className={
                                    event.status === "active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" :
                                    event.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" :
                                    event.status === "rejected" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-0" :
                                    event.status === "cancelled" ? "bg-red-500/10 text-red-600 dark:text-red-400 border-0" :
                                    "bg-muted text-muted-foreground border-0"
                                  }>{
                                    event.status === "active" ? "Approved" :
                                    event.status === "pending" ? "Pending Review" :
                                    event.status === "rejected" ? "Rejected" :
                                    event.status
                                  }</Badge>
                                  <span className="text-xs text-muted-foreground">{sold}/{event.total_seats} sold ({fillPct}%)</span>
                                </div>
                              </div>
                            </div>
                            <div className="md:text-right shrink-0">
                              <div className="font-semibold text-primary">{formatCurrency(sold * Number(event.price))}</div>
                              <div className="text-xs text-muted-foreground">{formatCurrency(Number(event.price))}/ticket</div>
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
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground mb-4">No events yet</p>
                    <Button onClick={() => navigate("/create-event")} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Create Your First Event
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          {/* ─── Analytics ─── */}
          {isOrganizer && (
            <TabsContent value="analytics" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base text-foreground">Total Revenue</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">{formatCurrency(totalRevenue)}</div>
                    <p className="text-sm text-muted-foreground mt-1">across all events</p>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base text-foreground">Tickets Sold</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      {myEvents.reduce((a, e) => a + (e.total_seats - e.available_seats), 0)}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="text-base text-foreground">Active Events</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
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
