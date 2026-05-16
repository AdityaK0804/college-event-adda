import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Download, Search, Users } from "lucide-react";
import { getEvent } from "@/services/events.service";
import { getEventRegistrations } from "@/services/registrations.service";
import { formatDate } from "@/lib/utils";

/** Convert attendee data to CSV and trigger download */
function downloadCSV(rows: any[], eventTitle: string) {
  const headers = ["Name", "Email", "RRN", "Department", "Year", "Quantity", "Payment", "Check-in", "Booked At"];
  const csvRows = [
    headers.join(","),
    ...rows.map((r: any) => [
      `"${r.profile?.name ?? ""}"`,
      `"${r.profile?.email ?? ""}"`,
      `"${r.profile?.rrn ?? ""}"`,
      `"${r.profile?.department ?? ""}"`,
      r.profile?.year ?? "",
      r.quantity,
      r.payment_status,
      r.ticket_status === "used" ? "Yes" : "No",
      `"${r.created_at?.slice(0, 10) ?? ""}"`,
    ].join(","))
  ];
  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendees-${eventTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const Attendees = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  const { data: registrations = [], isLoading: regsLoading } = useQuery({
    queryKey: ["event-registrations", id],
    queryFn: () => getEventRegistrations(id!),
    enabled: !!id,
  });

  const isLoading = eventLoading || regsLoading;

  // Filter by search term
  const filtered = registrations.filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.profile?.name?.toLowerCase().includes(q) ||
      r.profile?.email?.toLowerCase().includes(q) ||
      r.profile?.rrn?.toLowerCase().includes(q) ||
      r.profile?.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Attendees</h1>
            <p className="text-sm text-gray-500">{event?.title ?? "Loading…"}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, RRN, department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            className="gap-1.5 shrink-0"
            onClick={() => downloadCSV(registrations, event?.title ?? "event")}
            disabled={registrations.length === 0}
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="flex gap-4 mb-4 text-sm text-gray-500">
            <span>{registrations.length} total</span>
            <span>{registrations.filter((r: any) => r.ticket_status === "used").length} checked in</span>
            <span>{registrations.filter((r: any) => r.payment_status === "paid").length} paid</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">{search ? "No matching attendees" : "No registrations yet"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 font-medium text-gray-600 hidden md:table-cell">RRN</th>
                    <th className="px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Department</th>
                    <th className="px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Year</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Qty</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Payment</th>
                    <th className="px-4 py-3 font-medium text-gray-600">Check-in</th>
                    <th className="px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((reg: any) => (
                    <tr key={reg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{reg.profile?.name ?? "—"}</div>
                        <div className="text-xs text-gray-400">{reg.profile?.email}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell font-mono text-xs">{reg.profile?.rrn ?? "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{reg.profile?.department ?? "—"}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">{reg.profile?.year ?? "—"}</td>
                      <td className="px-4 py-3">{reg.quantity}</td>
                      <td className="px-4 py-3">
                        <Badge className={
                          reg.payment_status === "paid" ? "bg-green-100 text-green-800" :
                          reg.payment_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {reg.payment_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={
                          reg.ticket_status === "used" ? "bg-blue-100 text-blue-800" :
                          reg.ticket_status === "confirmed" ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-600"
                        }>
                          {reg.ticket_status === "used" ? "✓ In" : reg.ticket_status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-500 text-xs">
                        {reg.created_at ? formatDate(reg.created_at) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Attendees;
