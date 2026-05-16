
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center mb-4">
              <span className="text-2xl font-bold text-eventx-purple">Event<span className="text-eventx-orange">X</span></span>
            </Link>
            <p className="text-gray-600 text-sm">
              Discover and book the best events in Indian colleges. EventX connects students with opportunities.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Explore Events
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Register
                </Link>
              </li>
              <li>
                <Link to="/create-event" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Host an Event
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/events?category=Technical" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Technical
                </Link>
              </li>
              <li>
                <Link to="/events?category=Cultural" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Cultural
                </Link>
              </li>
              <li>
                <Link to="/events?category=Sports" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Sports
                </Link>
              </li>
              <li>
                <Link to="/events?category=Business" className="text-gray-600 hover:text-eventx-purple text-sm">
                  Business
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-gray-600 text-sm">
                support@eventx.in
              </li>
              <li className="text-gray-600 text-sm">
                +91 98765 43210
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-6 flex flex-col md:flex-row justify-between">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} EventX. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-eventx-purple">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-eventx-purple">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
