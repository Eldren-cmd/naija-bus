import type { ReactNode } from "react";

export type PanelTone = "route" | "fare" | "trip" | "report" | "neutral";

type PanelCardProps = {
  title: string;
  subtitle?: string;
  tone?: PanelTone;
  iconLabel?: string;
  className?: string;
  headerMeta?: ReactNode;
  children: ReactNode;
};

const panelToneIconMap: Record<PanelTone, string> = {
  route: "RT",
  fare: "NG",
  trip: "TR",
  report: "RP",
  neutral: "NT",
};

export function PanelCard({
  title,
  subtitle,
  tone = "neutral",
  iconLabel,
  className,
  headerMeta,
  children,
}: PanelCardProps) {
  return (
    <section className={`card panel-card panel-tone-${tone} ${className ?? ""}`.trim()}>
      <header className="panel-card-head">
        <div className="panel-card-title-wrap">
          <span className={`panel-icon-badge panel-icon-${tone}`} aria-hidden="true">
            {iconLabel ?? panelToneIconMap[tone]}
          </span>
          <div className="panel-card-copy">
            <h3 className="panel-title">{title}</h3>
            {subtitle && <p className="muted panel-subtitle">{subtitle}</p>}
          </div>
        </div>
        {headerMeta && <div className="panel-card-meta">{headerMeta}</div>}
      </header>
      <div className="panel-card-body">{children}</div>
    </section>
  );
}
