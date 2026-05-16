import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Calendar, MapPin, FileText } from "lucide-react";
import QRCode from "qrcode";
import { formatDate } from "@/lib/utils";

interface Props {
  registration: {
    id: string;
    ticket_id: string;
    qr_data: string | null;
    quantity: number;
    total_amount: number;
  };
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    college: string;
    category: string;
  };
  onClose: () => void;
}

const TicketConfirmModal = ({ registration, event, onClose }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !registration.qr_data) return;
    QRCode.toCanvas(canvasRef.current, registration.qr_data, {
      width: 180,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });
  }, [registration.qr_data]);

  const handleDownloadQR = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `ticket-${registration.ticket_id.slice(0, 8)}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const { generateTicketPDF } = await import("@/lib/ticket-pdf");
      await generateTicketPDF({
        ticketId: registration.ticket_id,
        eventTitle: event.title,
        eventDate: formatDate(event.date),
        eventTime: event.time,
        venue: event.location,
        college: event.college,
        category: event.category,
        studentName: "Attendee",
        quantity: registration.quantity,
        qrData: registration.qr_data,
      });
    } catch {
      // Fallback to QR download
      handleDownloadQR();
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <span className="bg-green-100 p-1 rounded-full">
              <Check className="h-4 w-4" />
            </span>
            Booking Confirmed!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-2">
          {/* Event info */}
          <div className="w-full border rounded-xl p-4 mb-4 bg-gradient-to-br from-eventx-light-purple to-white">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-base leading-tight flex-1 pr-2">{event.title}</h3>
              <Badge className="bg-eventx-purple text-xs shrink-0">{event.category}</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(event.date)} at {event.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                <span>{event.location}, {event.college}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-eventx-light-purple/60 flex justify-between text-xs">
              <span className="text-gray-500">Ticket ID</span>
              <span className="font-mono font-medium">{registration.ticket_id.slice(0, 12).toUpperCase()}</span>
            </div>
          </div>

          {/* QR Code */}
          <div className="border-2 border-dashed border-gray-200 p-3 rounded-xl bg-white mb-4">
            <canvas ref={canvasRef} className="block" />
          </div>

          <p className="text-xs text-gray-500 text-center mb-4">
            Show this QR code at the event entrance for check-in.
          </p>

          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 gap-1.5 text-sm" onClick={handleDownloadPDF} disabled={pdfLoading}>
              <FileText className="h-4 w-4" />
              {pdfLoading ? "Generating…" : "PDF Ticket"}
            </Button>
            <Button className="flex-1 bg-eventx-purple hover:bg-eventx-dark-purple text-sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketConfirmModal;
