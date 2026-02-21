import { useEffect, useState } from "react";
import { reportFare } from "../lib/api";
import type { ToastTone } from "./ToastStack";
import type { TrafficLevel } from "../types";
import type { FormEvent } from "react";

type ReportFarePanelProps = {
  routeId: string | null;
  routeName?: string;
  onSubmitted?: () => void;
  onToast?: (tone: ToastTone, message: string) => void;
};

const TOKEN_STORAGE_KEY = "naija_transport_jwt";

export function ReportFarePanel({ routeId, routeName, onSubmitted, onToast }: ReportFarePanelProps) {
  const [token, setToken] = useState("");
  const [reportedFare, setReportedFare] = useState("");
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>("medium");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      setToken(saved);
    }
  }, []);

  const handleTokenChange = (nextToken: string) => {
    setToken(nextToken);
    const normalized = nextToken.trim();
    if (!normalized) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!routeId) {
      onToast?.("error", "Select a route before submitting a fare report.");
      return;
    }

    const authToken = token.trim();
    if (!authToken) {
      onToast?.("error", "JWT is required. Login first, then paste your token.");
      return;
    }

    const fareAmount = Number(reportedFare);
    if (!Number.isFinite(fareAmount) || fareAmount <= 0) {
      onToast?.("error", "Enter a valid fare amount greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await reportFare(
        {
          routeId,
          reportedFare: fareAmount,
          trafficLevel,
          notes: notes.trim() || undefined,
        },
        authToken,
      );

      setReportedFare("");
      setNotes("");
      onToast?.("success", `Fare report saved at NGN ${response.amount.toFixed(0)}.`);
      onSubmitted?.();
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to submit fare report";
      onToast?.("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="report-card card">
      <h3 className="panel-title">Report Fare</h3>
      <p className="muted">
        {routeName ? `Submit your latest fare for ${routeName}.` : "Select a route to submit your latest fare."}
      </p>

      <form className="report-form" onSubmit={onSubmit}>
        <label>
          JWT token
          <input
            type="password"
            placeholder="Paste Bearer token from login"
            value={token}
            onChange={(event) => handleTokenChange(event.target.value)}
          />
        </label>

        <div className="report-grid">
          <label>
            Reported fare (NGN)
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={50}
              placeholder="e.g. 450"
              value={reportedFare}
              onChange={(event) => setReportedFare(event.target.value)}
            />
          </label>

          <label>
            Traffic
            <select
              value={trafficLevel}
              onChange={(event) => setTrafficLevel(event.target.value as TrafficLevel)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label>
          Notes (optional)
          <textarea
            rows={3}
            placeholder="Context e.g. rain, hold-up, diversion..."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>

        <button type="submit" className="estimate-btn" disabled={!routeId || submitting}>
          {submitting ? "Submitting..." : "Submit Fare Report"}
        </button>
      </form>
    </section>
  );
}
