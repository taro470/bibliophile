'use client';

import React from 'react';
import { BottomSheet } from '@/components/ui';
import { Tags, LogOut } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTags: () => void;
  onLogout: () => void;
}

export function SettingsSheet({
  isOpen,
  onClose,
  onOpenTags,
  onLogout,
}: SettingsSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="設定">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => {
            onOpenTags();
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
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Tags size={20} />
          タグ管理
        </button>
        <button
          onClick={() => {
            onLogout();
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
            color: '#EF4444',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <LogOut size={20} />
          ログアウト
        </button>
      </div>
    </BottomSheet>
  );
}
