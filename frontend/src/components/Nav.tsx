import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const isRouteFinderPath = (pathname: string): boolean =>
  pathname === "/map" || pathname === "/search" || pathname.startsWith("/route/");

const isTripsPath = (pathname: string): boolean =>
  pathname === "/trips" || pathname === "/my-trips";

export function Nav() {
  const { pathname } = useLocation();
  const { isAuthenticated, user, clearSession } = useAuth();

  return (
    <header className="global-nav-wrap">
      <nav className="global-nav" aria-label="Primary">
        <Link to="/" className="global-nav-brand">
          <span className="global-nav-brand-icon" aria-hidden="true">
            🚌
          </span>
          <span className="global-nav-brand-text">Naija Transport</span>
        </Link>

        <div className="global-nav-links">
          <Link
            to="/map"
            className={`global-nav-link ${isRouteFinderPath(pathname) ? "active" : ""}`}
          >
            Route Finder
          </Link>

          {isAuthenticated && (
            <Link to="/trips" className={`global-nav-link ${isTripsPath(pathname) ? "active" : ""}`}>
              My Trips
            </Link>
          )}

          {isAuthenticated && user?.role === "admin" && (
            <Link to="/admin" className={`global-nav-link ${pathname === "/admin" ? "active" : ""}`}>
              Admin
            </Link>
          )}

          <span className="global-nav-divider" aria-hidden="true" />

          {isAuthenticated ? (
            <button type="button" className="global-nav-link global-nav-ghost" onClick={clearSession}>
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" className={`global-nav-link ${pathname === "/login" ? "active" : ""}`}>
                Login
              </Link>
              <Link to="/signup" className="global-nav-cta">
                Sign up free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
