import Skeleton from "./Skeleton";

export default function ReviewResultsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading review results">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Skeleton className="h-24 w-full sm:w-56" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>

      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>

      <p className="text-center text-sm text-zinc-500">Analyzing your code with GPT...</p>
    </div>
  );
}
