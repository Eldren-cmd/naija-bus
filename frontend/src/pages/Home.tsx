import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const QUICK_ROUTES = ["Ojota -> CMS", "Lekki -> VI", "Berger -> Oshodi", "Yaba -> Ikeja"] as const;
const TRUST_PILLS = ["Live commuter data", "Lagos-focused routes", "Crowd-updated fares"] as const;

const FEATURE_CARDS = [
  {
    icon: "FA",
    tone: "fare",
    title: "Live Fare Estimates",
    description:
      "See what commuters actually paid on your route in recent hours, not static guesses.",
  },
  {
    icon: "TR",
    tone: "traffic",
    title: "Traffic Reports",
    description:
      "Know about go-slow, roadblocks, and checkpoints before leaving home or office.",
  },
  {
    icon: "CM",
    tone: "community",
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
            {isAuthenticated ? "Open Route Finder" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="home-hero">
        <div className="home-hero-grid">
          <div className="home-hero-copy">
            <p className="home-kicker">Lagos Transport Intelligence</p>
            <h1 className="home-title">
              Know the fare before <span>you board.</span>
            </h1>
            <p className="home-subtitle">
              One page, one job: help you find your route and see the current fare fast. Powered by
              commuters on the road today.
            </p>
            <div className="home-trust-pills">
              {TRUST_PILLS.map((pill) => (
                <span key={pill}>{pill}</span>
              ))}
            </div>
          </div>

          <aside className="home-search-card">
            <p className="home-search-label">Start with route search</p>
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
            <p className="home-search-helper">Quick picks:</p>
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
          </aside>
        </div>
      </section>

      <section className="home-features-wrap">
        <div className="home-section-head">
          <p className="home-section-kicker">Why Naija Transport</p>
          <h2>Built for daily Lagos commuters</h2>
        </div>
        <div className="home-features">
          {FEATURE_CARDS.map((feature) => (
            <article className={`home-feature-card tone-${feature.tone}`} key={feature.title}>
              <span className={`home-feature-icon tone-${feature.tone}`} aria-hidden="true">
                {feature.icon}
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-how">
        <p className="home-section-kicker">How It Works</p>
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
        <p>Search your route now, check fare in seconds, and travel with better price clarity.</p>
        <div className="home-cta-actions">
          <Link to="/map" className="home-cta-primary">
            Search Route Now
          </Link>
          <Link to="/signup" className="home-cta-secondary">
            Create account
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
