'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';

interface DroppableFolderCardProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function DroppableFolderCard({ id, children, disabled }: DroppableFolderCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    disabled,
  });

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        scale: isOver ? 1.05 : 1,
        borderColor: isOver ? 'var(--color-primary)' : 'var(--color-border)',
        boxShadow: isOver ? '0 0 20px rgba(99, 102, 241, 0.3)' : 'none',
      }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: 'var(--radius-lg)', // Match FolderCard radius
        position: 'relative',
        zIndex: isOver ? 10 : 1,
      }}
    >
      {children}
    </motion.div>
  );
}
