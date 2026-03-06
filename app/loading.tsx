export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F9FB] dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2C365D] border-t-transparent dark:border-[#7c8cb8] dark:border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
