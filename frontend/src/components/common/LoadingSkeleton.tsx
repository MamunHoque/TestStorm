import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function LoadingSkeleton({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  lines = 1,
}: LoadingSkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const shimmerAnimation = {
    backgroundPosition: ['200% 0', '-200% 0'],
  };

  const transition = {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} h-4`}
            style={{
              width: index === lines - 1 ? '75%' : width,
              backgroundSize: '400% 100%',
            }}
            animate={shimmerAnimation}
            transition={transition}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={{
        width,
        height,
        backgroundSize: '400% 100%',
      }}
      animate={shimmerAnimation}
      transition={transition}
    />
  );
}

interface MetricsSkeletonProps {
  className?: string;
}

export function MetricsSkeleton({ className = '' }: MetricsSkeletonProps) {
  return (
    <div className={`glass-panel ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <LoadingSkeleton variant="circular" width={20} height={20} />
              <LoadingSkeleton variant="circular" width={8} height={8} />
            </div>
            <LoadingSkeleton variant="text" width="60%" height="2rem" />
            <LoadingSkeleton variant="text" width="40%" height="0.75rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChartSkeletonProps {
  className?: string;
}

export function ChartSkeleton({ className = '' }: ChartSkeletonProps) {
  return (
    <div className={`glass-panel ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <LoadingSkeleton variant="text" width="200px" height="1.5rem" />
        <div className="flex space-x-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <LoadingSkeleton key={index} variant="rounded" width="80px" height="32px" />
          ))}
        </div>
      </div>
      <div className="h-80 flex items-end justify-between space-x-2">
        {Array.from({ length: 20 }).map((_, index) => (
          <LoadingSkeleton
            key={index}
            variant="rectangular"
            width="100%"
            height={`${Math.random() * 60 + 20}%`}
          />
        ))}
      </div>
    </div>
  );
}