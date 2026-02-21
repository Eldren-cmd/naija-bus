import { useEffect, useMemo, useState } from "react";
import { searchRoutesAndStops } from "../lib/api";
import type { FormEvent } from "react";
import type { SearchResponse } from "../types";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onSelectRoute: (routeId: string, nextQuery: string) => void;
};

export function SearchInput({ value, onChange, onSubmit, onSelectRoute }: SearchInputProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const showDropdown = useMemo(() => {
    if (!isFocused) return false;
    if (loading) return true;
    if (error) return true;
    if (!results) return false;
    return results.counts.total > 0;
  }, [error, isFocused, loading, results]);

  useEffect(() => {
    let cancelled = false;
    const query = value.trim();
    if (query.length < 2) {
      setResults(null);
      setError(null);
      setLoading(false);
      return;
    }

    const timerId = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchRoutesAndStops(query);
        if (!cancelled) setResults(data);
      } catch (requestError) {
        if (cancelled) return;
        const message = requestError instanceof Error ? requestError.message : "Search failed";
        setError(message);
        setResults(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [value]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(value.trim());
  };

  const handleRouteClick = (routeId: string, queryLabel: string) => {
    onSelectRoute(routeId, queryLabel);
    setIsFocused(false);
  };

  return (
    <div className="search-box search-wrapper">
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          className="search-input"
          placeholder="Search route, origin, destination..."
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120);
          }}
        />
        <button type="submit">Search</button>
      </form>

      {showDropdown && (
        <div className="search-dropdown">
          {loading && <p className="muted small">Searching...</p>}
          {error && !loading && <p className="error-text">{error}</p>}

          {!loading && results && (
            <>
              {results.routes.length > 0 && (
                <div className="search-group">
                  <p className="search-group-title">Routes</p>
                  <ul className="search-suggestion-list">
                    {results.routes.map((route) => (
                      <li key={`route-${route._id}`}>
                        <button
                          type="button"
                          onMouseDown={() => handleRouteClick(route._id, route.name)}
                        >
                          <strong>{route.name}</strong>
                          <span>
                            {route.origin} to {route.destination}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.stops.length > 0 && (
                <div className="search-group">
                  <p className="search-group-title">Stops</p>
                  <ul className="search-suggestion-list">
                    {results.stops.map((stop) => (
                      <li key={`stop-${stop._id}`}>
                        <button
                          type="button"
                          onMouseDown={() => handleRouteClick(stop.route._id, stop.route.name)}
                        >
                          <strong>{stop.name}</strong>
                          <span>
                            {stop.route.name} ({stop.route.origin} to {stop.route.destination})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.counts.total === 0 && <p className="muted small">No suggestions found.</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
