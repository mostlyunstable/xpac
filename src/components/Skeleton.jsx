export function SkeletonLine({ className = '' }) {
  return <div className={`bg-surface-container-highest rounded animate-pulse ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-surface-container-lowest rounded-xl border border-outline-variant p-6 space-y-4 ${className}`}>
      <SkeletonLine className="h-6 w-1/3" />
      <SkeletonLine className="h-4 w-2/3" />
      <SkeletonLine className="h-4 w-1/2" />
      <div className="flex gap-4 pt-4">
        <SkeletonLine className="h-10 w-24 rounded-lg" />
        <SkeletonLine className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} className={`h-10 ${j === 0 ? 'w-1/4' : 'flex-1'} rounded-lg`} />
          ))}
        </div>
      ))}
    </div>
  );
}
