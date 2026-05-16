import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/useAuth";
import { useState } from "react";
import { Menu, X, User, Triangle, History, ScanLine, Plus, Shield } from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const close = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('[Navbar] logout error:', err);
    } finally {
      close();
      navigate('/');
    }
  };

  const isOrganizer = user?.role === "organizer" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-white shadow-sm py-4 px-4 md:px-8 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2" onClick={close}>
          <Triangle className="h-6 w-6 text-eventx-purple fill-eventx-orange stroke-eventx-purple" />
          <span className="text-xl font-bold text-eventx-purple">
            Crescent<span className="text-eventx-orange">Pass</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/events" className="text-sm text-gray-600 hover:text-eventx-purple transition-colors">Events</Link>
          <Link to="/past-events" className="text-sm text-gray-600 hover:text-eventx-purple transition-colors flex items-center gap-1">
            <History className="h-3.5 w-3.5" /> Past
          </Link>
          {isOrganizer && (
            <Link to="/create-event" className="text-sm text-gray-600 hover:text-eventx-purple transition-colors flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Create Event
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {isAdmin && (
                <Link to="/admin" className="text-sm text-gray-600 hover:text-eventx-purple transition-colors flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" /> Admin
                </Link>
              )}
              <Link to="/dashboard" className="text-sm text-gray-600 hover:text-eventx-purple transition-colors">Dashboard</Link>
              <Link to="/profile" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-eventx-purple transition-colors">
                <div className="w-7 h-7 rounded-full bg-eventx-light-purple flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-eventx-purple" />
                </div>
                <span className="max-w-[100px] truncate">{user?.name?.split(" ")[0]}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>Sign out</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild><Link to="/login">Sign in</Link></Button>
              <Button size="sm" className="bg-eventx-purple hover:bg-eventx-dark-purple" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>

        <button className="md:hidden p-1" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-t shadow-lg z-50">
          <div className="flex flex-col divide-y">
            <Link to="/events" className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50" onClick={close}>Events</Link>
            <Link to="/past-events" className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={close}>
              <History className="h-4 w-4" /> Past Events
            </Link>
            {isOrganizer && (
              <Link to="/create-event" className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={close}>
                <Plus className="h-4 w-4" /> Create Event
              </Link>
            )}
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={close}>
                    <Shield className="h-4 w-4" /> Admin Panel
                  </Link>
                )}
                <Link to="/dashboard" className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50" onClick={close}>Dashboard</Link>
                <Link to="/profile" className="px-6 py-3.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={close}>
                  <User className="h-4 w-4" /> {user?.name}
                </Link>
                <div className="px-6 py-4">
                  <Button variant="outline" className="w-full" onClick={handleLogout}>Sign out</Button>
                </div>
              </>
            ) : (
              <div className="px-6 py-4 flex flex-col gap-2">
                <Button variant="outline" className="w-full" asChild onClick={close}><Link to="/login">Sign in</Link></Button>
                <Button className="w-full bg-eventx-purple hover:bg-eventx-dark-purple" asChild onClick={close}>
                  <Link to="/register">Register</Link>
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
