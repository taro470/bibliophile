'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './Chip.module.css';

interface ChipProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  icon?: React.ReactNode;
  color?: string;
  size?: 'sm' | 'md';
}

export function Chip({
  label,
  isActive = false,
  onClick,
  onRemove,
  icon,
  color,
  size = 'md',
}: ChipProps) {
  const colorStyle = color ? { '--chip-color': color } as React.CSSProperties : {};

  return (
    <motion.button
      type="button"
      className={`${styles.chip} ${styles[size]} ${isActive ? styles.active : ''} ${color ? styles.colored : ''}`}
      style={colorStyle}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      layout
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {onRemove && (
        <span
          className={styles.remove}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          role="button"
          aria-label={`${label}を削除`}
        >
          ✕
        </span>
      )}
    </motion.button>
  );
}

// Tag Chip specifically for tags
interface TagChipProps {
  name: string;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function TagChip({ name, color, isActive, onClick, onRemove }: TagChipProps) {
  return (
    <Chip
      label={name}
      icon="🏷️"
      color={color}
      isActive={isActive}
      onClick={onClick}
      onRemove={onRemove}
      size="sm"
    />
  );
}
