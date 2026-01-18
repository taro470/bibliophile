'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui';
import { Edit2, Trash2 } from 'lucide-react';

interface FolderActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  folderName: string;
}

export function FolderActionSheet({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  folderName,
}: FolderActionSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`フォルダ: ${folderName}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => {
            onEdit();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            width: '100%',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Edit2 size={20} />
          編集する
        </button>
        <button
          onClick={() => {
            onDelete();
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px',
            width: '100%',
            border: 'none',
            background: 'none',
            fontSize: '16px',
            color: '#EF4444', // Red
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Trash2 size={20} />
          削除する
        </button>
      </div>
    </BottomSheet>
  );
}
