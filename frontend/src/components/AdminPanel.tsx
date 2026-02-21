import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { deleteRouteAdmin, getRoutes, updateRouteAdmin } from "../lib/api";
import type { RouteSummary } from "../types";

type EditableRoute = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  corridor: string;
  baseFare: string;
};

const toEditableRoute = (route: RouteSummary): EditableRoute => ({
  id: route._id,
  name: route.name,
  origin: route.origin,
  destination: route.destination,
  corridor: route.corridor,
  baseFare: String(route.baseFare),
});

export function AdminPanel() {
  const { accessToken, user } = useAuth();
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditableRoute | null>(null);

  const canManageRoutes = user?.role === "admin" && Boolean(accessToken?.trim());

  const sortedRoutes = useMemo(
    () => [...routes].sort((a, b) => a.name.localeCompare(b.name)),
    [routes],
  );

  const loadRoutes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRoutes();
      setRoutes(data);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to load routes";
      setError(message);
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRoutes();
  }, []);

  const onStartEdit = (route: RouteSummary) => {
    setEditing(toEditableRoute(route));
  };

  const onCancelEdit = () => {
    setEditing(null);
  };

  const onSaveEdit = async () => {
    if (!editing) return;
    const token = accessToken?.trim();
    if (!token) {
      setError("Admin token missing. Sign in again.");
      return;
    }

    const baseFare = Number(editing.baseFare);
    if (!Number.isFinite(baseFare) || baseFare <= 0) {
      setError("Base fare must be a positive number.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateRouteAdmin(
        editing.id,
        {
          name: editing.name.trim(),
          origin: editing.origin.trim(),
          destination: editing.destination.trim(),
          corridor: editing.corridor.trim(),
          baseFare,
        },
        token,
      );
      setEditing(null);
      await loadRoutes();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to update route";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const onDeleteRoute = async (route: RouteSummary) => {
    const token = accessToken?.trim();
    if (!token) {
      setError("Admin token missing. Sign in again.");
      return;
    }

    const confirmed = window.confirm(`Delete route "${route.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await deleteRouteAdmin(route._id, token);
      setRoutes((previous) => previous.filter((item) => item._id !== route._id));
      if (editing?.id === route._id) setEditing(null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to delete route";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!canManageRoutes) {
    return (
      <main className="app-shell">
        <section className="admin-shell card">
          <p className="kicker">Phase 5 Admin</p>
          <h1>Admin Panel</h1>
          <p className="error-text">Admin access is required for this page.</p>
          <Link to="/" className="top-nav-link login-back-link">
            Back to Route Finder
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="admin-shell card">
        <p className="kicker">Phase 5 Admin</p>
        <h1>Route Management</h1>
        <p className="muted">Edit or delete routes directly without Postman.</p>

        <div className="admin-toolbar">
          <button type="button" className="estimate-btn" onClick={() => void loadRoutes()} disabled={loading || saving}>
            {loading ? "Refreshing..." : "Refresh Routes"}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="admin-table-wrap">
          {loading && <p className="muted">Loading routes...</p>}

          {!loading && sortedRoutes.length === 0 && <p className="muted">No routes found.</p>}

          {!loading && sortedRoutes.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Corridor</th>
                  <th>Base Fare</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRoutes.map((route) => {
                  const isEditing = editing?.id === route._id;

                  return (
                    <tr key={route._id}>
                      <td>
                        {isEditing ? (
                          <input
                            value={editing.name}
                            onChange={(event) =>
                              setEditing((previous) =>
                                previous ? { ...previous, name: event.target.value } : previous,
                              )
                            }
                          />
                        ) : (
                          route.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editing.origin}
                            onChange={(event) =>
                              setEditing((previous) =>
                                previous ? { ...previous, origin: event.target.value } : previous,
                              )
                            }
                          />
                        ) : (
                          route.origin
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editing.destination}
                            onChange={(event) =>
                              setEditing((previous) =>
                                previous ? { ...previous, destination: event.target.value } : previous,
                              )
                            }
                          />
                        ) : (
                          route.destination
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            value={editing.corridor}
                            onChange={(event) =>
                              setEditing((previous) =>
                                previous ? { ...previous, corridor: event.target.value } : previous,
                              )
                            }
                          />
                        ) : (
                          route.corridor
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={50}
                            value={editing.baseFare}
                            onChange={(event) =>
                              setEditing((previous) =>
                                previous ? { ...previous, baseFare: event.target.value } : previous,
                              )
                            }
                          />
                        ) : (
                          `NGN ${route.baseFare}`
                        )}
                      </td>
                      <td className="admin-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="estimate-btn"
                              onClick={() => void onSaveEdit()}
                              disabled={saving}
                            >
                              {saving ? "Saving..." : "Save"}
                            </button>
                            <button type="button" className="secondary-btn" onClick={onCancelEdit} disabled={saving}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={() => onStartEdit(route)}
                              disabled={saving}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="secondary-btn admin-delete-btn"
                              onClick={() => void onDeleteRoute(route)}
                              disabled={saving}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
