export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 bg-white/5 rounded-xl" />
        <div className="h-80 bg-white/5 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-96 bg-white/5 rounded-xl" />
        <div className="h-96 bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}
