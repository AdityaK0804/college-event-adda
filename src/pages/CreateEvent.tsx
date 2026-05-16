import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createEvent } from "@/services/events.service";
import { Info } from "lucide-react";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(2, "Location is required"),
  college: z.string().min(2, "College is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().refine(v => !isNaN(Number(v)) && Number(v) >= 0, "Enter a valid price"),
  total_seats: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid seat count"),
  image_url: z.string().url("Enter a valid image URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIES = ["Technical", "Cultural", "Sports", "Business", "Literary", "Workshop", "Other"];

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "", description: "", date: "", time: "", location: "",
      college: "B.S. Abdur Rahman Crescent Institute of Science and Technology",
      category: "", price: "0", total_seats: "100", image_url: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast({ title: "You must be logged in to create an event", variant: "destructive" });
      return;
    }
    try {
      await createEvent({
        title: values.title,
        description: values.description,
        date: values.date,
        time: values.time,
        location: values.location,
        college: values.college,
        category: values.category,
        price: Number(values.price),
        total_seats: Number(values.total_seats),
        image_url: values.image_url || undefined,
        organizer_id: user.id,
        organizer_name: user.name,   // from session shim — always available
      });
      toast({ title: "Event submitted for review! It will go live once approved." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: err?.message ?? "Failed to create event", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Create Event</h1>
          <p className="text-muted-foreground mt-1">Host your event and reach students at Crescent</p>
        </header>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex gap-3 text-sm text-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Events are reviewed by admins before going live. You'll be notified once approved.</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>Fill in the information about your event</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl><Input placeholder="e.g. TechXplore 2025" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl><Textarea placeholder="Describe your event..." className="min-h-[100px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="date" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="time" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time *</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue *</FormLabel>
                    <FormControl><Input placeholder="e.g. Main Auditorium" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="price" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticket Price (₹) *</FormLabel>
                      <FormControl><Input type="number" min="0" step="1" placeholder="0 for free" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="total_seats" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Seats *</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="image_url" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Image URL</FormLabel>
                    <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      Submitting…
                    </span>
                  ) : "Submit for Review"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CreateEvent;
