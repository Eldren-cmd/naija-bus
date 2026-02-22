import type { FormEvent } from "react";

const QUICK_ROUTES = ["Ojota → CMS", "Lekki → VI", "Berger → Oshodi", "Yaba → Ikeja"] as const;

type SearchBarProps = {
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSubmit: (query: string) => void;
};

export function SearchBar({ query, loading, onQueryChange, onSubmit }: SearchBarProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = query.trim();
    if (!normalized) return;
    onSubmit(normalized);
  };

  const onQuickRoute = (value: string) => {
    onQueryChange(value);
    onSubmit(value);
  };

  return (
    <div className="searchbar-shell">
      <form className="searchbar-form" onSubmit={handleSubmit}>
        <div className="searchbar-input-wrap">
          <span className="searchbar-icon" aria-hidden="true">
            ◎
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="searchbar-input"
            placeholder="e.g. Ojota, CMS, Lekki, Ikeja..."
            aria-label="Search route, stop, or area"
          />
        </div>
        <button type="submit" className="searchbar-submit" disabled={loading}>
          {loading ? "Searching..." : "Find Route"}
        </button>
      </form>

      <div className="searchbar-quick scrollbar-hide">
        {QUICK_ROUTES.map((route) => (
          <button
            key={route}
            type="button"
            className="searchbar-pill"
            onClick={() => onQuickRoute(route)}
          >
            {route}
          </button>
        ))}
      </div>
    </div>
  );
}
