// components/loading/TaskDetailSkeleton.jsx
export function TaskDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-32 bg-muted/30 rounded" />

      {/* Title row */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-14 bg-muted/40 rounded" />
          <div className="h-5 w-20 bg-muted/30 rounded-full" />
          <div className="h-5 w-16 bg-muted/30 rounded-full" />
        </div>
        <div className="h-9 w-3/4 bg-muted/40 rounded-lg" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-40 rounded-2xl bg-muted/30" />
          <div className="h-64 rounded-2xl bg-muted/30" />
        </div>
        <div>
          <div className="h-96 rounded-2xl bg-muted/30" />
        </div>
      </div>
    </div>
  );
}