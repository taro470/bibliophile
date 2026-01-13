'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './MemoCard.module.css';
import { MemoType, MEMO_LABELS, MEMO_ICONS, MEMO_COLORS } from '@/types';

interface MemoCardProps {
  id: string;
  type: MemoType;
  content: string;
  sourcePage?: string | null;
  pinned?: boolean;
  createdAt?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
}

export function MemoCard({
  id,
  type,
  content,
  sourcePage,
  pinned = false,
  createdAt,
  onEdit,
  onDelete,
  onPin,
}: MemoCardProps) {
  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`${styles.card} ${pinned ? styles.pinned : ''}`}
    >
      <div className={styles.header}>
        <span className={`${styles.type} ${styles[type.toLowerCase()]}`}>
          <span className={styles.typeIcon}>{MEMO_ICONS[type]}</span>
          {MEMO_LABELS[type]}
        </span>

        <div className={styles.actions}>
          {onPin && (
            <button
              className={`${styles.actionBtn} ${pinned ? styles.pinnedBtn : ''}`}
              onClick={onPin}
              aria-label={pinned ? 'ピン解除' : 'ピン留め'}
            >
              📌
            </button>
          )}
          {onEdit && (
            <button className={styles.actionBtn} onClick={onEdit} aria-label="編集">
              ✏️
            </button>
          )}
          {onDelete && (
            <button className={styles.actionBtn} onClick={onDelete} aria-label="削除">
              🗑️
            </button>
          )}
        </div>
      </div>

      <p className={styles.content}>{content}</p>

      <div className={styles.footer}>
        {sourcePage && (
          <span className={styles.sourcePage}>p.{sourcePage}</span>
        )}
        {formattedDate && (
          <span className={styles.date}>{formattedDate}</span>
        )}
      </div>
    </motion.div>
  );
}
