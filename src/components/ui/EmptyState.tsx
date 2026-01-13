'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './EmptyState.module.css';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {icon && (
        <motion.div
          className={styles.icon}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        >
          {icon}
        </motion.div>
      )}
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

// Preset empty states
export function EmptyBooks({ onAddBook }: { onAddBook: () => void }) {
  return (
    <EmptyState
      icon={<BooksIcon />}
      title="本がまだありません"
      description="最初の本を追加して、読書記録を始めましょう"
      action={{ label: '本を追加', onClick: onAddBook }}
    />
  );
}

export function EmptyMemos({ onAddMemo }: { onAddMemo: () => void }) {
  return (
    <EmptyState
      icon={<MemoIcon />}
      title="メモがありません"
      description="この本から得た気づきをメモしましょう"
      action={{ label: 'メモを追加', onClick: onAddMemo }}
    />
  );
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={<SearchIcon />}
      title="見つかりませんでした"
      description="検索条件を変えてみてください"
    />
  );
}

// Icons
function BooksIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

function MemoIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
