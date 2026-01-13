'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BottomSheet } from '@/components/ui';
import { BookStatus, STATUS_LABELS } from '@/types';
import styles from './StatusBottomSheet.module.css';

interface StatusBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: BookStatus;
  onStatusChange: (status: BookStatus) => void;
  bookTitle?: string;
}

const statuses: BookStatus[] = ['TO_READ', 'READING', 'READ'];

const statusConfig: Record<BookStatus, { icon: string; description: string }> = {
  TO_READ: { icon: '📚', description: 'いつか読みたい本' },
  READING: { icon: '📖', description: '今読んでいる本' },
  READ: { icon: '✅', description: '読み終わった本' },
};

export function StatusBottomSheet({
  isOpen,
  onClose,
  currentStatus,
  onStatusChange,
  bookTitle,
}: StatusBottomSheetProps) {
  const handleSelect = (status: BookStatus) => {
    if (status !== currentStatus) {
      onStatusChange(status);
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="ステータスを変更">
      <div className={styles.container}>
        {bookTitle && (
          <p className={styles.bookTitle}>{bookTitle}</p>
        )}
        <div className={styles.options}>
          {statuses.map((status, index) => (
            <motion.button
              key={status}
              className={`${styles.option} ${currentStatus === status ? styles.active : ''}`}
              onClick={() => handleSelect(status)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className={styles.icon}>{statusConfig[status].icon}</span>
              <div className={styles.content}>
                <span className={styles.label}>{STATUS_LABELS[status]}</span>
                <span className={styles.description}>{statusConfig[status].description}</span>
              </div>
              {currentStatus === status && (
                <motion.span
                  className={styles.check}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
