import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Triangle } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Architecture",
  "MBA", "MCA", "Other"
];

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rrn, setRrn] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"student" | "organizer">("student");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("1");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side validation ─────────────────────────────────────────
    if (!name || !email || !password || !confirmPassword) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    console.log('[Register] handleSubmit called, setting isLoading=true');
    setIsLoading(true);
    let registrationSucceeded = false;

    try {
      console.log('[Register] Calling register()…');
      await register({ email, password, name, rrn, department, year: parseInt(year), phone, role });
      console.log('[Register] register() resolved without throwing — success!');
      registrationSucceeded = true;

      toast({
        title: "✅ Account created!",
        description: "Check your email to verify your account, then sign in.",
      });
    } catch (err: any) {
      console.error('[Register] register() threw:', err);

      const message: string = err?.message ?? String(err) ?? 'Registration failed';
      const isProfileError = message.toLowerCase().includes('profile');

      if (isProfileError) {
        toast({
          title: "⚠️ Account created but profile setup failed",
          description: "Your account exists — please try logging in. If issues persist, contact support.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Registration failed",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      // ALWAYS reset loading — no matter what happened above
      console.log('[Register] finally block: setting isLoading=false, success was:', registrationSucceeded);
      setIsLoading(false);
    }

    // Navigate ONLY after confirmed success, outside try/catch so it doesn’t get
    // swallowed by the catch block above.
    if (registrationSucceeded) {
      console.log('[Register] Navigating to /login…');
      navigate("/login");
    }
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
              <Triangle className="h-8 w-8 text-eventx-purple fill-eventx-orange stroke-eventx-purple" />
            </div>
            <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
            <CardDescription>Join Crescent Pass</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input id="name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rrn">RRN / Register Number</Label>
                  <Input id="rrn" placeholder="e.g. 2020701001" value={rrn} onChange={(e) => setRrn(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="your.email@crescent.edu.in" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(y => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Account Type *</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="organizer">Event Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
              </div>

              <Button type="submit" className="w-full bg-eventx-purple hover:bg-eventx-dark-purple" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Creating account…
                  </span>
                ) : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-center text-sm w-full">
              Already have an account?{" "}
              <Link to="/login" className="text-eventx-purple hover:underline font-medium">Sign in</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
