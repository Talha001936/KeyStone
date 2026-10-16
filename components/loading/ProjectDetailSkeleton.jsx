// components/loading/ProjectDetailSkeleton.jsx
export function ProjectDetailSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="h-4 w-20 bg-muted/40 rounded" />
          <div className="h-9 w-72 bg-muted/40 rounded-lg" />
          <div className="h-4 w-96 bg-muted/30 rounded" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-10 w-24 bg-muted/30 rounded-lg" />
          <div className="h-10 w-32 bg-muted/30 rounded-lg" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/30" />
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((col) => (
          <div key={col} className="space-y-3">
            <div className="h-7 w-32 rounded-lg bg-muted/40" />
            {[1, 2].map((card) => (
              <div key={card} className="h-32 rounded-xl bg-muted/30" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}