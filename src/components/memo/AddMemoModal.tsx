'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal, BottomSheet, Button, TextArea, Input } from '@/components/ui';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { MemoType, MEMO_LABELS, MEMO_ICONS, MemoFormData } from '@/types';
import styles from './AddMemoModal.module.css';

interface AddMemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle?: string;
  onSubmit: (data: MemoFormData) => Promise<void>;
  initialData?: Partial<MemoFormData>;
  isEditing?: boolean;
}

const memoTypes: MemoType[] = ['SUMMARY', 'QUOTE', 'DATA'];

export function AddMemoModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  onSubmit,
  initialData,
  isEditing = false,
}: AddMemoModalProps) {
  const [type, setType] = useState<MemoType>(initialData?.type || 'SUMMARY');
  const [content, setContent] = useState(initialData?.content || '');
  const [sourcePage, setSourcePage] = useState(initialData?.sourcePage || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('内容を入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        bookId,
        type,
        content: content.trim(),
        sourcePage: sourcePage.trim() || undefined,
      });

      // Reset form
      setContent('');
      setSourcePage('');
      setType('SUMMARY');
      onClose();
    } catch (err) {
      setError('保存に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const segments = memoTypes.map((t) => ({
    value: t,
    label: MEMO_LABELS[t],
    icon: MEMO_ICONS[t],
  }));

  const content_inner = (
    <form onSubmit={handleSubmit} className={styles.form}>
      {bookTitle && (
        <p className={styles.bookTitle}>{bookTitle}</p>
      )}

      <div className={styles.field}>
        <label className={styles.label}>種類</label>
        <SegmentControl
          segments={segments}
          value={type}
          onChange={setType}
          size="sm"
        />
      </div>

      <div className={styles.field}>
        <TextArea
          label="内容"
          placeholder={getPlaceholder(type)}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <Input
          label="ページ番号（任意）"
          placeholder="例: 42"
          value={sourcePage}
          onChange={(e) => setSourcePage(e.target.value)}
          type="text"
          inputMode="numeric"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>
          キャンセル
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {isEditing ? '保存' : 'メモを追加'}
        </Button>
      </div>
    </form>
  );

  // Use BottomSheet on mobile, Modal on desktop
  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'メモを編集' : 'メモを追加'}
      >
        {content_inner}
      </BottomSheet>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'メモを編集' : 'メモを追加'}
      size="md"
    >
      {content_inner}
    </Modal>
  );
}

function getPlaceholder(type: MemoType): string {
  switch (type) {
    case 'SUMMARY':
      return 'この章の要点を自分の言葉でまとめましょう...';
    case 'QUOTE':
      return '心に響いた一文を記録しましょう...';
    case 'DATA':
      return '覚えておきたい数字や事実をメモしましょう...';
  }
}
