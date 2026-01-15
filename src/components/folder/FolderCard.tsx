'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './FolderCard.module.css';

interface FolderCardProps {
  id: string;
  name: string;
  bookCount?: number;
  color?: string;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

export function FolderCard({
  id,
  name,
  bookCount = 0,
  color,
  onClick,
  onEdit,
  onDelete,
}: FolderCardProps) {
  return (
    <motion.div
      className={styles.card}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={{ '--folder-color': color || '#7c3aed' } as React.CSSProperties}
    >
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          📁
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{name}</h3>
          <span className={styles.count}>{bookCount} 冊</span>
        </div>

        {onEdit && (
          <button
            className={styles.menuButton}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(e);
            }}
            aria-label="フォルダを編集"
          >
            ⋮
          </button>
        )}
      </div>
    </motion.div>
  );
}
