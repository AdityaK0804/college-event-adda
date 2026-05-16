import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

// Providers
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Eagerly-loaded pages (needed on first paint)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (code splitting)
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const PastEvents = lazy(() => import("./pages/PastEvents"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const CreateEvent = lazy(() => import("./pages/CreateEvent"));
const Scanner = lazy(() => import("./pages/Scanner"));
const Admin = lazy(() => import("./pages/Admin"));
const Attendees = lazy(() => import("./pages/Attendees"));
const SavedEvents = lazy(() => import("./pages/SavedEvents"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 min
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm text-muted-foreground">Loading…</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Index />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/past-events" element={<PastEvents />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Auth-required */}
                <Route path="/dashboard" element={
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute><Profile /></ProtectedRoute>
                } />
                <Route path="/create-event" element={
                  <ProtectedRoute requiredRole={["organizer", "admin"]}><CreateEvent /></ProtectedRoute>
                } />
                <Route path="/scan/:eventId" element={
                  <ProtectedRoute requiredRole={["organizer", "admin"]}><Scanner /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>
                } />
                <Route path="/events/:id/attendees" element={
                  <ProtectedRoute requiredRole={["organizer", "admin"]}><Attendees /></ProtectedRoute>
                } />
                <Route path="/dashboard/saved" element={
                  <ProtectedRoute><SavedEvents /></ProtectedRoute>
                } />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
