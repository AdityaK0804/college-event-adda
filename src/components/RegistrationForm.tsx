import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/useAuth";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  rrn: z.string().optional(),
  department: z.string().optional(),
  college: z.string().min(2, "College name required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  eventTitle: string;
  quantity: number;
  totalAmount: number;
}

export function RegistrationForm({ onSubmit, onCancel, eventTitle, quantity, totalAmount }: Props) {
  const { profile } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      rrn: "",
      department: "",
      college: "B.S. Abdur Rahman Crescent Institute of Science and Technology",
    },
  });

  // Auto-fill from profile on mount
  useEffect(() => {
    if (profile) {
      form.setValue("name", (profile as any).name ?? "");
      form.setValue("email", (profile as any).email ?? "");
      form.setValue("phone", (profile as any).phone ?? "");
      form.setValue("rrn", (profile as any).rrn ?? "");
      form.setValue("department", (profile as any).department ?? "");
    }
  }, [profile, form]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h3 className="font-bold text-lg">Confirm Details</h3>
          <p className="text-xs text-gray-500">{eventTitle}</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl><Input type="tel" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-3">
            <FormField control={form.control} name="rrn" render={({ field }) => (
              <FormItem>
                <FormLabel>RRN</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="department" render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
          </div>

          <div className="mt-4 border rounded-lg p-3 bg-gray-50 text-sm">
            <div className="flex justify-between font-semibold">
              <span>{quantity} ticket{quantity > 1 ? "s" : ""}</span>
              <span className="text-eventx-orange">{totalAmount === 0 ? "Free" : formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <Button type="submit" className="w-full bg-eventx-purple hover:bg-eventx-dark-purple">
            {totalAmount === 0 ? "Confirm Registration" : "Proceed to Payment"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
