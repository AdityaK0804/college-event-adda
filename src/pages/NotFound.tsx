import { useLocation, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { FileX } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background theme-transition">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
            <FileX className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Page not found</p>
          <p className="text-sm text-muted-foreground/70 mb-8 max-w-md mx-auto">
            The page <code className="text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">{location.pathname}</code> doesn't exist.
          </p>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
