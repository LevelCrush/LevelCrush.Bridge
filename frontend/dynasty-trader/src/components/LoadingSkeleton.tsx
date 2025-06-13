import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function LoadingSkeleton({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-slate-700';
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        width: width || (variant === 'circular' ? height : '100%'),
        height: height || (variant === 'circular' ? width : variant === 'text' ? '1rem' : '4rem'),
      }}
    />
  ));
  
  return count > 1 ? (
    <div className="space-y-2">
      {skeletons}
    </div>
  ) : (
    skeletons[0]
  );
}

export function MarketListingSkeleton() {
  return (
    <div className="bg-slate-700 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <LoadingSkeleton width="60%" height="1.25rem" className="mb-2" />
          <div className="flex items-center space-x-4">
            <LoadingSkeleton width="80px" />
            <LoadingSkeleton width="120px" />
            <LoadingSkeleton width="100px" />
          </div>
        </div>
        <div className="text-right ml-4">
          <LoadingSkeleton width="100px" height="1.5rem" className="mb-2" />
          <LoadingSkeleton width="80px" height="2rem" variant="rectangular" />
        </div>
      </div>
    </div>
  );
}

export function CharacterCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
      <div>
        <LoadingSkeleton width="150px" height="1.25rem" className="mb-1" />
        <LoadingSkeleton width="200px" />
      </div>
      <div className="text-right">
        <LoadingSkeleton width="60px" className="mb-1" />
        <LoadingSkeleton width="80px" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center">
        <LoadingSkeleton variant="circular" width={40} height={40} />
        <div className="ml-4 flex-1">
          <LoadingSkeleton width="80px" className="mb-1" />
          <LoadingSkeleton width="60px" height="1.5rem" />
        </div>
      </div>
    </div>
  );
}