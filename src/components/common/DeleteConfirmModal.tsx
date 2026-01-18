'use client';

import React from 'react';
import { Modal, BottomSheet, Button } from '@/components/ui';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string | React.ReactNode;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
        {message}
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
          キャンセル
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          isLoading={isDeleting}
          style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }} // Red for danger
        >
          削除する
        </Button>
      </div>
    </div>
  );

  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {content}
    </Modal>
  );
}
