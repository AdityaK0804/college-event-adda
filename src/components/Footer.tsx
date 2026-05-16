
import { Link } from "react-router-dom";
import CrescentLogo from "@/components/CrescentLogo";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 mt-16 theme-transition">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <CrescentLogo className="text-primary" size={24} />
              <span className="text-xl font-bold tracking-tight">
                <span className="text-foreground">Crescent</span>
                <span className="text-primary">Pass</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Discover and book the best events at Crescent. CrescentPass connects students with opportunities — no paper, no queue.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/events" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/create-event" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Host an Event
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/events?category=Technical" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Technical
                </Link>
              </li>
              <li>
                <Link to="/events?category=Cultural" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Cultural
                </Link>
              </li>
              <li>
                <Link to="/events?category=Sports" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Sports
                </Link>
              </li>
              <li>
                <Link to="/events?category=Business" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                  Business
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2.5">
              <li className="text-muted-foreground text-sm">
                support@crescentpass.in
              </li>
              <li className="text-muted-foreground text-sm">
                +91 98765 43210
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CrescentPass. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
