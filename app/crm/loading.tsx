export default function CRMLoading() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-gradient-to-br from-sky-50/70 via-background to-blue-50/50 dark:from-sky-950/25 dark:via-background dark:to-blue-950/20">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2C365D] border-t-transparent dark:border-[#7c8cb8] dark:border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
