import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useState } from "react";
import { Menu, X, User, History, Plus, Shield, Sun, Moon } from "lucide-react";
import CrescentLogo from "@/components/CrescentLogo";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const close = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      /* noop */
    } finally {
      close();
      navigate('/');
    }
  };

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-background/80 backdrop-blur-lg border-b border-border/50 py-3 px-4 md:px-8 sticky top-0 z-40 theme-transition">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={close}>
          <CrescentLogo className="text-primary transition-transform duration-300 group-hover:scale-110" size={28} />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-foreground">Crescent</span>
            <span className="text-primary">Pass</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/events" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200">
            Events
          </Link>
          <Link to="/past-events" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Past
          </Link>
          {isOrganizer && (
            <Link to="/create-event" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200 flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Create
            </Link>
          )}

          <div className="w-px h-6 bg-border mx-2" />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2 ml-1">
              {isAdmin && (
                <Link to="/admin" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-all duration-200">
                Dashboard
              </Link>
              <Link to="/profile" className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-accent">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                  <User className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="max-w-[100px] truncate">{user?.name?.split(" ")[0]}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button className="p-1.5 rounded-lg hover:bg-accent transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-lg border-b border-border shadow-xl z-50 animate-fade-in">
          <div className="flex flex-col py-2">
            <Link to="/events" className="px-6 py-3 text-sm text-foreground hover:bg-accent transition-colors" onClick={close}>Events</Link>
            <Link to="/past-events" className="px-6 py-3 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2" onClick={close}>
              <History className="h-4 w-4" /> Past Events
            </Link>
            {isOrganizer && (
              <Link to="/create-event" className="px-6 py-3 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2" onClick={close}>
                <Plus className="h-4 w-4" /> Create Event
              </Link>
            )}
            <div className="h-px bg-border mx-4 my-1" />
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="px-6 py-3 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2" onClick={close}>
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <Link to="/dashboard" className="px-6 py-3 text-sm text-foreground hover:bg-accent transition-colors" onClick={close}>Dashboard</Link>
                <Link to="/profile" className="px-6 py-3 text-sm text-foreground hover:bg-accent transition-colors flex items-center gap-2" onClick={close}>
                  <User className="h-4 w-4" /> {user?.name}
                </Link>
                <div className="px-6 py-3">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>Sign out</Button>
                </div>
              </>
            ) : (
              <div className="px-6 py-3 flex flex-col gap-2">
                <Button variant="outline" className="w-full" asChild onClick={close}><Link to="/login">Sign in</Link></Button>
                <Button className="w-full bg-primary hover:bg-primary/90" asChild onClick={close}>
                  <Link to="/register">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
