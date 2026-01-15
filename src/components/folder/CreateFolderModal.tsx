'use client';

import React, { useState } from 'react';
import { Modal, BottomSheet, Button, Input } from '@/components/ui';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { BookStatus, STATUS_LABELS, STATUS_ICONS } from '@/types';
import styles from './CreateFolderModal.module.css';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, status: BookStatus, color: string) => Promise<void>;
  initialStatus?: BookStatus;
  initialData?: { name: string; status: BookStatus; color?: string };
  isEditing?: boolean;
}

const COLORS = [
  '#8B5CF6', // Purple (Default)
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
];

export function CreateFolderModal({
  isOpen,
  onClose,
  onSubmit,
  initialStatus = 'READING',
  initialData,
  isEditing = false,
}: CreateFolderModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [status, setStatus] = useState<BookStatus>(initialData?.status || initialStatus);
  const [color, setColor] = useState(initialData?.color || COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setStatus(initialData?.status || initialStatus);
      setColor(initialData?.color || COLORS[0]);
      setError(null);
    }
  }, [isOpen, initialData, initialStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('フォルダ名を入力してください');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), status, color);
      setName('');
      onClose();
    } catch (err) {
      console.error(err);
      setError('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusSegments = [
    { value: 'TO_READ' as BookStatus, label: '読みたい', icon: STATUS_ICONS.TO_READ },
    { value: 'READING' as BookStatus, label: '読書中', icon: STATUS_ICONS.READING },
    { value: 'READ' as BookStatus, label: '読了', icon: STATUS_ICONS.READ },
  ];

  const content = (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <Input
          label="フォルダ名"
          placeholder="例: ミステリー小説、技術書など"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus={!isEditing}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>ステータス</label>
        <SegmentControl
          segments={statusSegments}
          value={status}
          onChange={setStatus}
          size="sm"
        />
        <p className={styles.label} style={{ fontSize: '12px', marginTop: '4px' }}>
          ※このフォルダは「{STATUS_LABELS[status]}」リストに表示されます
        </p>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>テーマカラー</label>
        <div className={styles.colorGrid}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.colorOption} ${color === c ? styles.active : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`色を選択: ${c}`}
            />
          ))}
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? '保存' : '作成'}
        </Button>
      </div>
    </form>
  );

  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'フォルダを編集' : '新しいフォルダ'}
      >
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'フォルダを編集' : '新しいフォルダ'}
    >
      {content}
    </Modal>
  );
}
