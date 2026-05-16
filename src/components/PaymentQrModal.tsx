
import { QrCode, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface PaymentQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  amount: number;
  quantity: number;
}

const PaymentQrModal = ({
  isOpen,
  onClose,
  eventTitle,
  amount,
  quantity,
}: PaymentQrModalProps) => {
  const [paymentDone, setPaymentDone] = useState(false);
  const { toast } = useToast();

  const handlePaymentDone = () => {
    setPaymentDone(true);
    toast({
      title: "Payment Confirmed",
      description: "You will receive your e-ticket and event updates on WhatsApp within 24 hours.",
    });
    
    // Close modal after 2 seconds
    setTimeout(() => {
      setPaymentDone(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            {paymentDone 
              ? "Your payment has been confirmed." 
              : `Scan the QR code to pay ₹${amount.toFixed(2)} for ${quantity} ticket${quantity > 1 ? 's' : ''}.`}
          </DialogDescription>
        </DialogHeader>
        
        {paymentDone ? (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-center font-medium">Payment Successful!</p>
            <p className="text-center text-sm text-gray-500 mt-2">
              You will receive your e-ticket and event updates on WhatsApp within 24 hours.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg mb-4">
              <QrCode className="h-48 w-48" />
            </div>
            <p className="text-sm text-gray-500">Event: {eventTitle}</p>
            <p className="font-medium">Amount: ₹{amount.toFixed(2)}</p>
          </div>
        )}
        
        <DialogFooter className="sm:justify-center">
          {!paymentDone && (
            <Button onClick={handlePaymentDone} className="bg-eventx-purple hover:bg-eventx-dark-purple">
              Payment Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentQrModal;
