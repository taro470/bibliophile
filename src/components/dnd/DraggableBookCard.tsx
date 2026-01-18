'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableBookCardProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableBookCard({ id, children }: DraggableBookCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    touchAction: 'none',
  };

  // Prevent click if dragging happened
  // Note: we rely on dnd-kit's isDragging and simple event capture if needed.
  // Actually, dnd-kit usually consumes click if drag activated with sensors.
  // But to be sure, we can block pointer events on children while dragging.
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* 
        Block click events on children while dragging specifically.
        Also, if user drags and drops without valid target (cancel),
        dnd-kit *should* prevent click if activation constraint met.
        If it's not preventing, we might need a custom capture.
      */}
      <div style={{ pointerEvents: isDragging ? 'none' : 'auto' }}>
        {children}
      </div>
    </div>
  );
}
