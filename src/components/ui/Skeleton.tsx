'use client';

import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius,
  className = '',
}: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
      }}
    />
  );
}

// BookCard Skeleton
export function BookCardSkeleton() {
  return (
    <div className={styles.bookCard}>
      <div className={styles.bookCardHeader}>
        <Skeleton width="60%" height="24px" />
        <Skeleton width="70px" height="24px" borderRadius="var(--radius-full)" />
      </div>
      <Skeleton width="40%" height="16px" />
      <div className={styles.bookCardFooter}>
        <Skeleton width="80px" height="20px" borderRadius="var(--radius-full)" />
        <Skeleton width="60px" height="16px" />
      </div>
    </div>
  );
}

// Memo Card Skeleton
export function MemoCardSkeleton() {
  return (
    <div className={styles.memoCard}>
      <div className={styles.memoCardHeader}>
        <Skeleton width="60px" height="20px" borderRadius="var(--radius-full)" />
        <Skeleton width="40px" height="16px" />
      </div>
      <Skeleton width="100%" height="60px" />
    </div>
  );
}
