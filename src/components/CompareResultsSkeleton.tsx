import Skeleton from "./Skeleton";

export default function CompareResultsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading comparison results">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-44 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      <Skeleton className="h-28 w-full rounded-lg" />

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>

      <p className="text-center text-sm text-zinc-500">Comparing solutions with GPT...</p>
    </div>
  );
}
