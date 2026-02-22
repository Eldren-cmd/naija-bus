type RouteCardSkeletonProps = {
  count?: number;
  includeSaveAction?: boolean;
  className?: string;
};

export function RouteCardSkeleton({
  count = 5,
  includeSaveAction = false,
  className,
}: RouteCardSkeletonProps) {
  return (
    <ul className={`route-list skeleton-list ${className ?? ""}`.trim()} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={`route-skeleton-${index + 1}`} className="route-list-item route-list-item-stagger">
          <div className="skeleton-card skeleton-route-card">
            <span className="skeleton-line skeleton-line-lg" />
            <span className="skeleton-line skeleton-line-sm" />
          </div>
          {includeSaveAction && <div className="skeleton-pill skeleton-save-btn" />}
        </li>
      ))}
    </ul>
  );
}
