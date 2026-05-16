import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateProfile } from "@/services/auth.service";
import { User } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  department: z.string().optional(),
  year: z.string().optional(),
  bio: z.string().optional(),
});

const DEPARTMENTS = [
  "Computer Science and Engineering", "Information Technology",
  "Electronics and Communication Engineering", "Electrical and Electronics Engineering",
  "Mechanical Engineering", "Civil Engineering", "Chemical Engineering",
  "Biotechnology", "Architecture", "MBA", "MCA", "Other",
];

const Profile = () => {
  const { user, profile, isProfileLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", phone: "", department: "", year: "1", bio: "",
    },
  });

  // Populate form when profile data arrives.
  // IMPORTANT: `form` is intentionally excluded from deps — it is recreated
  // on every render and including it causes an infinite loop.
  // form.reset() is stable (a ref-backed method from react-hook-form).
  useEffect(() => {
    if (profile) {
      form.reset({
        name: (profile as any).name ?? "",
        phone: (profile as any).phone ?? "",
        department: (profile as any).department ?? "",
        year: String((profile as any).year ?? "1"),
        bio: (profile as any).bio ?? "",
      });
    }
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (values: any) => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        name: values.name,
        phone: values.phone || null,
        department: values.department || null,
        year: values.year ? parseInt(values.year) : null,
        bio: values.bio || null,
      });
      await refreshProfile();
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: err?.message ?? "Update failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Profile missing and not loading — show graceful message inside the page layout
  if (!isProfileLoading && !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-background theme-transition">
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

  const p = profile as any;

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account information</p>
        </header>

        {/* Identity card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-1 ring-primary/20">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate text-foreground">{p.name}</div>
                <div className="text-sm text-muted-foreground truncate">{p.email}</div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge className="bg-primary/10 text-primary border-0 capitalize text-xs">{p.role}</Badge>
                  {p.rrn && <span className="text-xs text-muted-foreground font-mono">RRN: {p.rrn}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Your details auto-fill on event registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input type="tel" placeholder="10-digit mobile number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="year" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {[1,2,3,4,5].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea placeholder="Tell us a bit about yourself…" className="resize-none" rows={3} {...field} /></FormControl>
                  </FormItem>
                )} />

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSaving}>
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                      Saving…
                    </span>
                  ) : "Save Changes"}
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

export default Profile;
