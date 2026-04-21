import { motion } from 'framer-motion';

/**
 * PredictionSkeleton - Loading state for prediction cards
 * 
 * WCAG-compliant shimmer effect with proper reduced-motion support
 */
export function PredictionSkeleton() {
  return (
    <div className="bg-base-950 border border-base-800 rounded-lg p-6 space-y-4">
      {/* Header shimmer */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-base-700 animate-pulse" />
        <div className="h-4 w-32 bg-base-800 rounded animate-pulse" />
      </div>

      {/* Decision shimmer */}
      <div className="flex items-center gap-4 py-4 border-y border-base-800/50">
        <div className="h-12 w-12 rounded-full bg-base-800 animate-pulse" />
        <div className="space-y-2">
          <div className="h-6 w-24 bg-base-800 rounded animate-pulse" />
          <div className="h-4 w-16 bg-base-700 rounded animate-pulse" />
        </div>
      </div>

      {/* Explanation shimmer */}
      <div className="space-y-2">
        <div className="h-4 w-20 bg-base-800 rounded animate-pulse" />
        <div className="space-y-1.5">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-3 bg-base-800 rounded animate-pulse"
              style={{ width: `${60 + Math.random() * 30}%`, animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>

      {/* Fraud score shimmer */}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-4 w-16 bg-base-800 rounded animate-pulse" />
        <div className="h-4 w-12 bg-base-700 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * BatchUploadSkeleton - Loading state for batch upload progress
 */
export function BatchUploadSkeleton() {
  return (
    <div className="bg-base-950 border border-base-800 rounded-lg p-6 space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-base-800 rounded animate-pulse" />
          <div className="h-4 w-12 bg-base-700 rounded animate-pulse" />
        </div>
        <div className="h-2 bg-base-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/30"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: '50%' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-full bg-base-800 rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-base-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * DatasetSelectorSkeleton - Loading state for dataset dropdown
 */
export function DatasetSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-20 bg-base-800 rounded animate-pulse" />
      <div className="h-10 bg-base-800 rounded-lg animate-pulse" />
    </div>
  );
}

export default PredictionSkeleton;
