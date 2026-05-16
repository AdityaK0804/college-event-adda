import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { getPendingEvents, approveEvent, rejectEvent } from "@/services/admin.service";
import { formatDate, formatCurrency } from "@/lib/utils";
import { CheckCircle2, XCircle, Calendar, MapPin, User, BadgeIndianRupee } from "lucide-react";

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pendingEvents = [], isLoading, isError } = useQuery({
    queryKey: ["admin-pending-events"],
    queryFn: getPendingEvents,
  });

  const approveMutation = useMutation({
    mutationFn: approveEvent,
    onMutate: async (eventId) => {
      // Optimistic update — remove from list immediately
      await queryClient.cancelQueries({ queryKey: ["admin-pending-events"] });
      const previous = queryClient.getQueryData(["admin-pending-events"]);
      queryClient.setQueryData(["admin-pending-events"], (old: any[]) =>
        (old ?? []).filter((e: any) => e.id !== eventId)
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Event approved ✓", description: "The event is now live and visible to students." });
    },
    onError: (err: any, _eventId, context) => {
      // Rollback on error
      queryClient.setQueryData(["admin-pending-events"], context?.previous);
      toast({ title: "Failed to approve event", description: err?.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-events"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectEvent,
    onMutate: async (eventId) => {
      await queryClient.cancelQueries({ queryKey: ["admin-pending-events"] });
      const previous = queryClient.getQueryData(["admin-pending-events"]);
      queryClient.setQueryData(["admin-pending-events"], (old: any[]) =>
        (old ?? []).filter((e: any) => e.id !== eventId)
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: "Event rejected", description: "The organizer will see the updated status." });
    },
    onError: (err: any, _eventId, context) => {
      queryClient.setQueryData(["admin-pending-events"], context?.previous);
      toast({ title: "Failed to reject event", description: err?.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pending-events"] });
    },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-gray-600">Review and moderate event submissions</p>
        </header>

        {isError ? (
          <div className="text-center py-16">
            <h3 className="text-xl font-bold mb-2">Could not load pending events</h3>
            <p className="text-gray-600 mb-4">Check your permissions or try again.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : pendingEvents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No events pending review</p>
              <p className="text-sm text-gray-400 mt-1">All caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{pendingEvents.length} event{pendingEvents.length !== 1 ? 's' : ''} pending review</p>
            {pendingEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{event.college}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 shrink-0">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.organizer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <BadgeIndianRupee className="h-4 w-4 shrink-0" />
                      <span>{event.price === 0 ? "Free" : formatCurrency(event.price)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline">{event.category}</Badge>
                    <span className="text-xs text-gray-400">{event.total_seats} seats</span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 gap-1.5"
                      onClick={() => approveMutation.mutate(event.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1.5"
                      onClick={() => rejectMutation.mutate(event.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Admin;
