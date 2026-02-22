import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const QUICK_ROUTES = ["Ojota -> CMS", "Lekki -> VI", "Berger -> Oshodi", "Yaba -> Ikeja"] as const;

const FEATURE_CARDS = [
  {
    icon: "LF",
    title: "Live Fare Estimates",
    description:
      "See what commuters actually paid on your route in recent hours, not static guesses.",
  },
  {
    icon: "TR",
    title: "Traffic Reports",
    description:
      "Know about go-slow, roadblocks, and checkpoints before leaving home or office.",
  },
  {
    icon: "CS",
    title: "Crowdsourced by Commuters",
    description:
      "Reports come from people currently on Lagos routes, improving accuracy every day.",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Search your route",
    description: "Type your origin and destination or choose from popular Lagos routes.",
  },
  {
    step: "02",
    title: "See the live fare",
    description: "Get a fare estimate tuned by recent commuter reports and traffic context.",
  },
  {
    step: "03",
    title: "Report and help others",
    description: "Submit fare and incident updates in seconds to improve data for the next rider.",
  },
] as const;

export function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState("");

  const navigateToSearch = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    navigate(`/map?q=${encodeURIComponent(normalized)}`);
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateToSearch(query);
  };

  return (
    <main className="home-shell">
      <header className="home-nav-wrap">
        <nav className="home-nav">
          <span className="home-logo">Naija Transport</span>
          <Link to={isAuthenticated ? "/map" : "/login"} className="home-nav-link">
            {isAuthenticated ? "Open App" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <p className="home-kicker">Lagos Transport Intelligence</p>
        <h1 className="home-title">
          Know the fare before <span>you board.</span>
        </h1>
        <p className="home-subtitle">
          Crowdsourced fares, live traffic reports, and route maps built by Lagos commuters for Lagos
          commuters.
        </p>

        <form className="home-search-form" onSubmit={handleSearch}>
          <label htmlFor="home-route-search" className="sr-only">
            Search route
          </label>
          <input
            id="home-route-search"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a route e.g. Ojota to CMS"
            className="home-search-input"
          />
          <button type="submit" className="home-search-btn">
            Find Route
          </button>
        </form>

        <div className="home-quick-links">
          {QUICK_ROUTES.map((route) => (
            <button
              key={route}
              type="button"
              className="home-quick-chip"
              onClick={() => navigateToSearch(route)}
            >
              {route}
            </button>
          ))}
        </div>
      </section>

      <section className="home-features-wrap">
        <div className="home-features">
          {FEATURE_CARDS.map((feature) => (
            <article className="home-feature-card" key={feature.title}>
              <span className="home-feature-icon" aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-how">
        <h2>How it works</h2>
        <div className="home-how-grid">
          {HOW_IT_WORKS.map((item) => (
            <article key={item.step} className="home-how-card">
              <p className="home-how-step">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-cta">
        <h2>Stop overpaying for daily transport.</h2>
        <p>Join commuters reporting fares and making Lagos transport pricing more transparent.</p>
        <div className="home-cta-actions">
          <Link to="/signup" className="home-cta-primary">
            Get started free
          </Link>
          <Link to="/map" className="home-cta-secondary">
            View map
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-links">
          <Link to="/map">Route Finder</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/signup">Create account</Link>
        </div>
        <p>
          Naija Transport | Built for Lagos commuters |{" "}
          <span className="home-brand">VerityWave Solutions</span>
        </p>
      </footer>
    </main>
  );
}
