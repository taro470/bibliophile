'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './SegmentControl.module.css';

interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SegmentControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function SegmentControl<T extends string>({
  segments,
  value,
  onChange,
  size = 'md',
}: SegmentControlProps<T>) {
  const activeIndex = segments.findIndex((s) => s.value === value);

  return (
    <div className={`${styles.container} ${styles[size]}`} role="tablist">
      {/* Active indicator */}
      <motion.div
        className={styles.indicator}
        layoutId="segment-indicator"
        initial={false}
        animate={{
          left: `${(100 / segments.length) * activeIndex}%`,
          width: `${100 / segments.length}%`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {segments.map((segment) => (
        <button
          key={segment.value}
          role="tab"
          aria-selected={value === segment.value}
          className={`${styles.segment} ${value === segment.value ? styles.active : ''}`}
          onClick={() => onChange(segment.value)}
        >
          {segment.icon && <span className={styles.icon}>{segment.icon}</span>}
          <span className={styles.label}>{segment.label}</span>
          {segment.count !== undefined && (
            <span className={styles.count}>{segment.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
