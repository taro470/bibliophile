'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { Modal, BottomSheet, Button, Input, TagChip, useToast } from '@/components/ui';
import styles from './TagEditModal.module.css';

const client = generateClient<Schema>();
type Tag = Schema['Tag']['type'];

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  bookTitle?: string;
  initialTagIds: string[];
  onTagsUpdated: () => void;
}

export function TagEditModal({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  initialTagIds,
  onTagsUpdated,
}: TagEditModalProps) {
  const { showToast } = useToast();

  // State
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTagIds);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTagIds(initialTagIds);
      fetchTags();
    }
  }, [isOpen, initialTagIds]);

  const fetchTags = async () => {
    try {
      const { data } = await client.models.Tag.list({});
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreatingTag(true);
    try {
      const { data } = await client.models.Tag.create({
        name: newTagName.trim(),
      });
      if (data) {
        setTags((prev) => [...prev, data]);
        setSelectedTagIds((prev) => [...prev, data.id]);
        setNewTagName('');
        showToast(`タグ「${data.name}」を作成しました`, 'success');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      showToast('タグの作成に失敗しました', 'error');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Get existing BookTags for this book
      const { data: existingBookTags } = await client.models.BookTag.list({
        filter: { bookId: { eq: bookId } }
      });

      // 2. Identify tags to remove
      const toRemove = existingBookTags.filter(
        (bt) => !selectedTagIds.includes(bt.tagId)
      );

      // 3. Identify tags to add
      const existingTagIds = existingBookTags.map((bt) => bt.tagId);
      const toAdd = selectedTagIds.filter(
        (tagId) => !existingTagIds.includes(tagId)
      );

      // 4. Execute updates
      await Promise.all([
        ...toRemove.map((bt) => client.models.BookTag.delete({ id: bt.id })),
        ...toAdd.map((tagId) =>
          client.models.BookTag.create({ bookId, tagId })
        )
      ]);

      showToast('タグを更新しました', 'success');
      onTagsUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update tags:', error);
      showToast('タグの更新に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const content = (
    <div className={styles.container}>
      {bookTitle && <p className={styles.bookTitle}>{bookTitle}</p>}

      <div className={styles.tagList}>
        {tags.map((tag) => (
          <TagChip
            key={tag.id}
            name={tag.name}
            color={tag.color || undefined}
            isActive={selectedTagIds.includes(tag.id)}
            onClick={() => toggleTag(tag.id)}
          />
        ))}
      </div>

      <div className={styles.newTag}>
        <Input
          placeholder="新しいタグを作成..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              createTag();
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={createTag}
          isLoading={isCreatingTag}
          disabled={!newTagName.trim()}
        >
          追加
        </Button>
      </div>

      <div className={styles.actions}>
        <Button type="button" variant="ghost" onClick={onClose}>
          キャンセル
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          isLoading={isSaving}
        >
          保存
        </Button>
      </div>
    </div>
  );

  // Responsive Modal/BottomSheet
  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="タグを編集">
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タグを編集" size="md">
      {content}
    </Modal>
  );
}
