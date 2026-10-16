// components/loading/ProjectListSkeleton.jsx
export function ProjectListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-muted/40 rounded-lg" />
          <div className="h-4 w-72 bg-muted/30 rounded" />
        </div>
        <div className="h-10 w-36 bg-muted/30 rounded-lg" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-56 rounded-2xl bg-muted/30 ring-1 ring-border/40"
          />
        ))}
      </div>
    </div>
  );
}