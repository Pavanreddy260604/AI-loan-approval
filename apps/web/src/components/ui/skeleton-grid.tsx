
import { SkeletonLoader } from "./atoms/SkeletonLoader";
import { Card } from "./molecules/Card";

/**
 * SkeletonGrid Component
 * 
 * A loading placeholder grid for the Admin and Billing pages in the Elite v2 design system.
 */
export function SkeletonGrid() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
         <div className="space-y-4">
            <SkeletonLoader width="120px" height="12px" />
            <SkeletonLoader width="300px" height="40px" />
            <SkeletonLoader width="500px" height="20px" />
         </div>
         <div className="flex gap-3">
            <SkeletonLoader width="100px" height="32px" />
            <SkeletonLoader width="180px" height="32px" />
         </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
         {[1, 2, 3, 4].map((i) => (
           <Card key={i} border className="h-32 flex flex-col justify-between">
              <SkeletonLoader width="80px" height="10px" />
              <SkeletonLoader width="150px" height="36px" />
              <SkeletonLoader width="100px" height="12px" />
           </Card>
         ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
         <Card border className="h-[500px]">
            <SkeletonLoader width="100%" height="100%" />
         </Card>
         <Card border className="h-[500px]">
            <SkeletonLoader width="100%" height="100%" />
         </Card>
      </div>
    </div>
  );
}
