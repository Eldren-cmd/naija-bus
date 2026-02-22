import { useState } from "react";
import { reportFare } from "../lib/api";
import { EmptyState } from "./EmptyState";
import { PanelCard } from "./PanelCard";
import { useAuthGuard } from "../hooks/useAuthGuard";
import type { ToastTone } from "./ToastStack";
import type { TrafficLevel } from "../types";
import type { FormEvent } from "react";

type ReportFarePanelProps = {
  routeId: string | null;
  routeName?: string;
  authToken?: string | null;
  onSubmitted?: () => void;
  onToast?: (tone: ToastTone, message: string) => void;
};

export function ReportFarePanel({
  routeId,
  routeName,
  authToken,
  onSubmitted,
  onToast,
}: ReportFarePanelProps) {
  const [reportedFare, setReportedFare] = useState("");
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>("medium");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const authGuard = useAuthGuard({ authToken, onToast });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!routeId) {
      onToast?.("error", "Select a route before submitting a fare report.");
      return;
    }

    const normalizedToken = authGuard.requireToken({
      action: "submit fare reports",
      blockedMessage: "Sign in first to submit fare reports.",
    });
    if (!normalizedToken) {
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
        normalizedToken,
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
    <PanelCard
      title="Report Fare"
      subtitle={routeName ? `Submit your latest fare for ${routeName}.` : "Select a route to submit your latest fare."}
      tone="report"
      iconLabel="RP"
      className="report-card"
    >
      {!routeId && (
        <EmptyState
          tone="report"
          compact
          title="Route not selected"
          message="Pick a route first to enable fare reporting for this trip corridor."
        />
      )}

      {!authGuard.canAct && (
        <EmptyState
          tone="report"
          compact
          iconLabel="IN"
          title="Sign in required"
          message="Login from /login to submit fare reports and earn contributor points."
        />
      )}

      <form className="report-form" onSubmit={onSubmit}>
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
          {submitting
            ? "Submitting..."
            : authGuard.getActionLabel({
                authenticated: "Submit Fare Report",
                unauthenticated: "Login to Submit Fare",
              })}
        </button>
      </form>
    </PanelCard>
  );
}
