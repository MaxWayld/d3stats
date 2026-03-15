export default function Loading() {
  return (
    <div className="flex-1 px-4 md:px-8 py-8 space-y-6 overflow-hidden">
      {/* Hero section */}
      <div className="space-y-4">
        <div className="h-4 w-32 skeleton" />
        <div className="h-14 w-56 skeleton" />
        <div className="flex flex-wrap gap-4 md:gap-8 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 skeleton" />
              <div className="h-6 w-16 skeleton" />
            </div>
          ))}
        </div>
      </div>

      {/* Chart + side cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-2 h-[360px] rounded-xl skeleton" />
        <div className="h-[360px] rounded-xl skeleton" />
        <div className="h-[360px] rounded-xl skeleton" />
      </div>

      {/* Table */}
      <div className="space-y-2">
        <div className="h-3 w-24 skeleton mb-3" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-full rounded-lg skeleton"
            style={{ opacity: 1 - i * 0.08 }}
          />
        ))}
      </div>
    </div>
  );
}
