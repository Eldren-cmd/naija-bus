import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { createRouteAdmin, deleteRouteAdmin, getRoutes, updateRouteAdmin } from "../lib/api";
import type { RouteSummary, TransportType } from "../types";

type EditableRoute = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  corridor: string;
  baseFare: string;
};

type CreateRouteForm = {
  name: string;
  origin: string;
  destination: string;
  corridor: string;
  baseFare: string;
  transportType: TransportType;
  confidenceScore: string;
  aliases: string;
  polyline: string;
};

const DEFAULT_CREATE_FORM: CreateRouteForm = {
  name: "",
  origin: "",
  destination: "",
  corridor: "",
  baseFare: "300",
  transportType: "danfo",
  confidenceScore: "0.7",
  aliases: "",
  polyline: "3.3788,6.5839 | 3.3900,6.5600 | 3.4100,6.5300",
};

const parsePolyline = (input: string): [number, number][] | null => {
  const points = input
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => segment.split(",").map((value) => Number(value.trim())));

  if (points.length < 2) return null;
  const parsed: [number, number][] = [];
  for (const point of points) {
    if (point.length !== 2) return null;
    const [lng, lat] = point;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null;
    parsed.push([lng, lat]);
  }
  return parsed;
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
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<EditableRoute | null>(null);
  const [createForm, setCreateForm] = useState<CreateRouteForm>(DEFAULT_CREATE_FORM);

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

  const onCreateRoute = async () => {
    const token = accessToken?.trim();
    if (!token) {
      setError("Admin token missing. Sign in again.");
      return;
    }

    const baseFare = Number(createForm.baseFare);
    const confidenceScore = Number(createForm.confidenceScore);
    const polylineCoordinates = parsePolyline(createForm.polyline);
    if (!Number.isFinite(baseFare) || baseFare <= 0) {
      setError("Base fare must be a positive number.");
      return;
    }
    if (!Number.isFinite(confidenceScore) || confidenceScore < 0 || confidenceScore > 1) {
      setError("Confidence score must be between 0 and 1.");
      return;
    }
    if (!polylineCoordinates) {
      setError("Polyline must contain at least 2 valid lng,lat points separated by |");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createRouteAdmin(
        {
          name: createForm.name.trim(),
          origin: createForm.origin.trim(),
          destination: createForm.destination.trim(),
          corridor: createForm.corridor.trim(),
          baseFare,
          transportType: createForm.transportType,
          confidenceScore,
          aliases: createForm.aliases
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          polyline: {
            type: "LineString",
            coordinates: polylineCoordinates,
          },
        },
        token,
      );
      setCreateForm(DEFAULT_CREATE_FORM);
      await loadRoutes();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to create route";
      setError(message);
    } finally {
      setCreating(false);
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
        <p className="muted">Create, edit, or delete routes directly without Postman.</p>

        <div className="admin-toolbar">
          <button type="button" className="estimate-btn" onClick={() => void loadRoutes()} disabled={loading || saving}>
            {loading ? "Refreshing..." : "Refresh Routes"}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}

        <section className="admin-create-form">
          <h3 className="panel-title">Create Route</h3>
          <div className="admin-create-grid">
            <label>
              Name
              <input
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, name: event.target.value }))
                }
                placeholder="Ojota -> CMS"
              />
            </label>
            <label>
              Origin
              <input
                value={createForm.origin}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, origin: event.target.value }))
                }
                placeholder="Ojota"
              />
            </label>
            <label>
              Destination
              <input
                value={createForm.destination}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, destination: event.target.value }))
                }
                placeholder="CMS"
              />
            </label>
            <label>
              Corridor
              <input
                value={createForm.corridor}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, corridor: event.target.value }))
                }
                placeholder="Ikorodu Road"
              />
            </label>
            <label>
              Base Fare
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={50}
                value={createForm.baseFare}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, baseFare: event.target.value }))
                }
              />
            </label>
            <label>
              Transport Type
              <select
                value={createForm.transportType}
                onChange={(event) =>
                  setCreateForm((previous) => ({
                    ...previous,
                    transportType: event.target.value as TransportType,
                  }))
                }
              >
                <option value="danfo">Danfo</option>
                <option value="brt">BRT</option>
                <option value="keke">Keke</option>
                <option value="bus">Bus</option>
                <option value="ferry">Ferry</option>
                <option value="mixed">Mixed</option>
              </select>
            </label>
            <label>
              Confidence (0-1)
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={createForm.confidenceScore}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, confidenceScore: event.target.value }))
                }
              />
            </label>
            <label>
              Aliases (comma-separated)
              <input
                value={createForm.aliases}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, aliases: event.target.value }))
                }
                placeholder="CMS, Marina, Island"
              />
            </label>
          </div>
          <label>
            Polyline points (`lng,lat | lng,lat | ...`)
            <textarea
              rows={2}
              value={createForm.polyline}
              onChange={(event) =>
                setCreateForm((previous) => ({ ...previous, polyline: event.target.value }))
              }
            />
          </label>
          <button type="button" className="estimate-btn" onClick={() => void onCreateRoute()} disabled={creating}>
            {creating ? "Creating..." : "Create Route"}
          </button>
        </section>

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
