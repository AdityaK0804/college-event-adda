import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";
import { getEvent } from "@/services/events.service";
import { validateTicket } from "@/services/registrations.service";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Scan } from "lucide-react";

type ScanState = "idle" | "scanning" | "success" | "error";

interface ScanResult {
  valid: boolean;
  student_name?: string;
  department?: string;
  rrn?: string;
  quantity?: number;
  reason?: string;
}

const REASON_LABELS: Record<string, string> = {
  not_found: "Ticket not found",
  already_used: "Already checked in",
  cancelled: "Ticket cancelled",
  unpaid: "Payment not confirmed",
};

const Scanner = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => getEvent(eventId!),
    enabled: !!eventId,
  });

  const processQr = useCallback(async (rawText: string) => {
    if (isValidating || scanState === "success") return;
    setIsValidating(true);
    setScanState("scanning");

    try {
      // Parse QR payload: { ticket_id, event_id, user_id, v }
      const payload = JSON.parse(rawText);
      if (!payload.ticket_id || !payload.event_id) {
        setResult({ valid: false, reason: "not_found" });
        setScanState("error");
        return;
      }

      const res = await validateTicket(payload.ticket_id, payload.event_id, user!.id);
      setResult(res);
      setScanState(res.valid ? "success" : "error");
      if (res.valid) {
        setScanCount((c) => c + 1);
        // Sound feedback
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          osc.connect(ctx.destination);
          osc.frequency.value = 880;
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch {}
      }
    } catch {
      setResult({ valid: false, reason: "not_found" });
      setScanState("error");
    } finally {
      setIsValidating(false);
    }
  }, [isValidating, scanState, user]);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    setScanState("idle");
    setResult(null);

    try {
      const reader = new BrowserQRCodeReader();
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            processQr(result.getText());
          }
        }
      );
      controlsRef.current = controls;
    } catch (err) {
      console.error("Camera access denied:", err);
    }
  }, [processQr]);

  const resetScan = () => {
    setScanState("idle");
    setResult(null);
  };

  useEffect(() => {
    startScanner();
    return () => {
      controlsRef.current?.stop();
    };
  }, []);  // eslint-disable-line

  // Auto-reset after success/error so next scan can begin
  useEffect(() => {
    if (scanState === "success" || scanState === "error") {
      const timer = setTimeout(resetScan, scanState === "success" ? 3000 : 2500);
      return () => clearTimeout(timer);
    }
  }, [scanState]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
        <button
          onClick={() => { controlsRef.current?.stop(); navigate(-1); }}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{event?.title ?? "Event Scanner"}</div>
          <div className="text-xs text-gray-500">{scanCount} checked in today</div>
        </div>
        <div className="w-16" />
      </header>

      {/* Camera + Overlay */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-sm">
          {/* Video */}
          <div className="rounded-2xl overflow-hidden bg-black aspect-square relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />

            {/* Scan result overlay */}
            {scanState === "success" && result && (
              <div className="absolute inset-0 bg-green-900/90 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-200">
                <CheckCircle2 className="h-16 w-16 text-green-400 mb-3" />
                <div className="text-xl font-bold text-green-300">Valid!</div>
                <div className="text-base font-medium mt-1">{result.student_name}</div>
                {result.department && (
                  <div className="text-sm text-green-300 mt-0.5">{result.department}</div>
                )}
                {result.rrn && (
                  <div className="text-xs text-green-400 mt-0.5 font-mono">RRN: {result.rrn}</div>
                )}
                <div className="text-xs text-green-400 mt-1">{result.quantity} ticket{(result.quantity ?? 1) > 1 ? "s" : ""}</div>
              </div>
            )}

            {scanState === "error" && result && (
              <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center rounded-2xl animate-in fade-in duration-200">
                <XCircle className="h-16 w-16 text-red-400 mb-3" />
                <div className="text-xl font-bold text-red-300">Invalid</div>
                <div className="text-sm text-red-400 mt-1">{REASON_LABELS[result.reason ?? ""] ?? "Unknown error"}</div>
              </div>
            )}

            {/* Scanning corners decoration */}
            {scanState === "idle" && (
              <div className="absolute inset-6 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-eventx-purple rounded-tl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-eventx-purple rounded-tr" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-eventx-purple rounded-bl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-eventx-purple rounded-br" />
                {/* Scan line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-eventx-purple/60 animate-[scan_2s_ease-in-out_infinite]"
                  style={{ top: "50%", boxShadow: "0 0 8px #8B5CF6" }}
                />
              </div>
            )}
          </div>

          {/* Status text */}
          <div className="mt-6 text-center">
            {scanState === "idle" && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Scan className="h-4 w-4" />
                <span className="text-sm">Point camera at QR code</span>
              </div>
            )}
            {scanState === "scanning" && (
              <div className="flex items-center justify-center gap-2 text-yellow-400">
                <span className="w-4 h-4 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
                <span className="text-sm">Validating…</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer stat */}
      <div className="px-4 pb-8 text-center">
        <p className="text-xs text-gray-600">
          {event?.total_seats ? `${event.total_seats - event.available_seats} / ${event.total_seats} capacity used` : ""}
        </p>
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 5%; }
          50% { top: 95%; }
        }
      `}</style>
    </div>
  );
};

export default Scanner;
