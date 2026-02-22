import type { ReactNode } from "react";
import type { PanelTone } from "./PanelCard";

type EmptyStateProps = {
  title: string;
  message: string;
  tone?: PanelTone;
  iconLabel?: string;
  compact?: boolean;
  action?: ReactNode;
  className?: string;
};

const toneIconMap: Record<PanelTone, string> = {
  route: "RT",
  fare: "NG",
  trip: "TR",
  report: "RP",
  neutral: "NT",
};

export function EmptyState({
  title,
  message,
  tone = "neutral",
  iconLabel,
  compact = false,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`empty-state empty-state-${tone} ${compact ? "empty-state-compact" : ""} ${className ?? ""}`.trim()}
    >
      <span className="empty-state-icon" aria-hidden="true">
        {iconLabel ?? toneIconMap[tone]}
      </span>
      <div className="empty-state-copy">
        <p className="empty-state-title">{title}</p>
        <p className="muted">{message}</p>
      </div>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
