'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from './BookCard.module.css';
import { BookStatus, STATUS_LABELS, STATUS_COLORS } from '@/types';
import { TagChip } from '@/components/ui';

interface BookCardProps {
  id: string;
  title: string;
  author?: string | null;
  status: BookStatus;
  memoCount?: number;
  tags?: Array<{ id: string; name: string; color?: string | null }>;
  onStatusClick?: (e: React.MouseEvent) => void;
  updatedAt?: string;
  layoutId?: string;
}

export function BookCard({
  id,
  title,
  author,
  status,
  memoCount = 0,
  tags = [],
  onStatusClick,
  updatedAt,
  layoutId,
}: BookCardProps) {
  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    })
    : null;

  return (
    <motion.div
      layout
      layoutId={layoutId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ y: -4 }}
      className={styles.card}
    >
      <Link href={`/books/${id}`} className={styles.link}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button
            className={`${styles.status} ${styles[status.toLowerCase()]}`}
            onClick={onStatusClick}
            aria-label="ステータスを変更"
          >
            {STATUS_LABELS[status]}
          </button>
        </div>

        {author && <p className={styles.author}>{author}</p>}

        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className={styles.tag}>
                {tag.name}
              </span>
            ))}
            {tags.length > 3 && (
              <span className={styles.tagMore}>+{tags.length - 3}</span>
            )}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.memoCount}>
            <span className={styles.memoIcon}>📝</span>
            <span>{memoCount} メモ</span>
          </div>
          {formattedDate && (
            <span className={styles.date}>{formattedDate}</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
