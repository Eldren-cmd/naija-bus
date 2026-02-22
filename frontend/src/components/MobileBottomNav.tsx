import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const isRouteFinderPath = (pathname: string): boolean =>
  pathname === "/map" || pathname === "/search" || pathname.startsWith("/route/");

const isTripsPath = (pathname: string): boolean =>
  pathname === "/trips" || pathname === "/my-trips";

type MobileTab = {
  to: string;
  label: string;
  icon: string;
  active: (pathname: string) => boolean;
};

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const tabs: MobileTab[] = [
    {
      to: "/",
      label: "Home",
      icon: "⌂",
      active: (value) => value === "/",
    },
    {
      to: "/map",
      label: "Routes",
      icon: "◎",
      active: (value) => isRouteFinderPath(value),
    },
    {
      to: "/trips",
      label: "Trips",
      icon: "◉",
      active: (value) => isTripsPath(value),
    },
    {
      to: isAuthenticated ? "/map" : "/login",
      label: "Account",
      icon: "◌",
      active: (value) => value === "/login" || value === "/signup",
    },
  ];

  return (
    <nav className="mobile-bottom-nav pb-safe" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav-inner">
        {tabs.map((tab) => {
          const active = tab.active(pathname);
          return (
            <Link key={`${tab.label}-${tab.to}`} to={tab.to} className={`mobile-nav-tab ${active ? "active" : ""}`}>
              <span className="mobile-nav-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="mobile-nav-label">{tab.label}</span>
              {active && <span className="mobile-nav-active-bar" aria-hidden="true" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
