export default function Dashboard() {
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50">
          <p className="text-body p-4">Dashboard Widget</p>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50">
          <p className="text-body p-4">Dashboard Widget</p>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50">
          <p className="text-body p-4">Dashboard Widget</p>
        </div>
      </div>
      <div className="mt-4 min-h-[50vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <p className="text-body p-6">
          Welcome to your dashboard. This is where you&apos;ll find all your
          important information.
        </p>
      </div>
    </>
  );
}
