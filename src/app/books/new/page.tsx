'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from './page.module.css';

import { Button, Input, useToast, TagChip } from '@/components/ui';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { BookStatus, STATUS_LABELS } from '@/types';

const client = generateClient<Schema>();

type Tag = Schema['Tag']['type'];

const statusSegments = [
  { value: 'TO_READ' as BookStatus, label: '読みたい', icon: '📚' },
  { value: 'READING' as BookStatus, label: '読んでいる', icon: '📖' },
  { value: 'READ' as BookStatus, label: '読んだ', icon: '✅' },
];

function AddBookContent() {
  const router = useRouter();
  const { showToast } = useToast();

  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<BookStatus>('TO_READ');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tags
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  // Fetch tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data } = await client.models.Tag.list({});
        setTags(data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };
    fetchTags();
  }, []);

  // Toggle tag selection
  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Create new tag
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

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('タイトルを入力してください', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create book
      const { data: book } = await client.models.Book.create({
        title: title.trim(),
        author: author.trim() || undefined,
        status,
        memoCount: 0,
      });

      if (book && selectedTagIds.length > 0) {
        // Create book-tag associations
        await Promise.all(
          selectedTagIds.map((tagId) =>
            client.models.BookTag.create({
              bookId: book.id,
              tagId,
            })
          )
        );
      }

      showToast(`「${title}」を追加しました`, 'success');
      router.push('/');
    } catch (error) {
      console.error('Failed to create book:', error);
      showToast('本の追加に失敗しました', 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← 戻る
        </button>
        <h1 className={styles.title}>本を追加</h1>
        <div className={styles.spacer} />
      </header>

      <motion.form
        className={styles.form}
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className={styles.field}>
          <Input
            label="タイトル"
            placeholder="本のタイトルを入力"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className={styles.field}>
          <Input
            label="著者（任意）"
            placeholder="著者名を入力"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
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
        </div>

        <div className={styles.field}>
          <label className={styles.label}>タグ（任意）</label>
          <div className={styles.tagsGrid}>
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
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            本を追加
          </Button>
        </div>
      </motion.form>
    </div>
  );
}

export default function AddBookPage() {
  return (
    <Authenticator>
      <AddBookContent />
    </Authenticator>
  );
}
