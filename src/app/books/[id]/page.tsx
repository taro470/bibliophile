'use client';

import React, { useState, useCallback, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from './page.module.css';

import {
  Button, FAB, useToast, TagChip,
  EmptyMemos, MemoCardSkeleton
} from '@/components/ui';
import { SegmentControl } from '@/components/ui/SegmentControl';
import { StatusBottomSheet, TagEditModal } from '@/components/book';
import { MemoCard, AddMemoModal } from '@/components/memo';
import { BookStatus, MemoType, STATUS_LABELS, MEMO_LABELS, MEMO_ICONS, MemoFormData } from '@/types';

const client = generateClient<Schema>();

type Book = Schema['Book']['type'];
type InsightMemo = Schema['InsightMemo']['type'];
type Tag = Schema['Tag']['type'];

const memoTypeSegments = [
  { value: 'ALL' as const, label: 'すべて' },
  { value: 'SUMMARY' as MemoType, label: '要約', icon: '📝' },
  { value: 'QUOTE' as MemoType, label: '引用', icon: '💬' },
  { value: 'DATA' as MemoType, label: 'データ', icon: '📊' },
];

function BookDetailContent({ bookId }: { bookId: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  // State
  const [book, setBook] = useState<Book | null>(null);
  const [memos, setMemos] = useState<InsightMemo[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memoFilter, setMemoFilter] = useState<MemoType | 'ALL'>('ALL');

  // Modals
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [memoModalOpen, setMemoModalOpen] = useState(false);
  const [editingMemo, setEditingMemo] = useState<InsightMemo | null>(null);

  // Fetch book details
  const fetchBook = useCallback(async () => {
    try {
      const { data } = await client.models.Book.get({ id: bookId });
      if (data) {
        setBook(data);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Failed to fetch book:', error);
      showToast('本の取得に失敗しました', 'error');
      router.push('/');
    }
  }, [bookId, router, showToast]);

  // Fetch memos
  const fetchMemos = useCallback(async () => {
    try {
      const { data } = await client.models.InsightMemo.list({
        filter: { bookId: { eq: bookId } },
      });
      // Sort by pinned first, then by createdAt
      const sorted = data.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setMemos(sorted);
    } catch (error) {
      console.error('Failed to fetch memos:', error);
    }
  }, [bookId]);

  // Fetch book tags
  const fetchTags = useCallback(async () => {
    try {
      const { data: bookTags } = await client.models.BookTag.list({
        filter: { bookId: { eq: bookId } },
      });

      const tagPromises = bookTags.map(bt => client.models.Tag.get({ id: bt.tagId }));
      const tagResults = await Promise.all(tagPromises);
      const fetchedTags = tagResults
        .map(r => r.data)
        .map(r => r.data)
        .filter((t) => t !== null) as Tag[];

      setTags(fetchedTags);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }, [bookId]);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchBook(), fetchMemos(), fetchTags()]);
      setIsLoading(false);
    };
    init();
  }, [fetchBook, fetchMemos, fetchTags]);

  // Filter memos
  const filteredMemos = memoFilter === 'ALL'
    ? memos
    : memos.filter(m => m.type === memoFilter);

  // Handle status change
  const handleStatusChange = async (newStatus: BookStatus) => {
    if (!book) return;

    try {
      await client.models.Book.update({
        id: book.id,
        status: newStatus,
      });
      setBook({ ...book, status: newStatus });
      showToast(`ステータスを${STATUS_LABELS[newStatus]}に変更しました`, 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('ステータスの変更に失敗しました', 'error');
    }
  };

  // Add memo
  const handleAddMemo = async (data: MemoFormData) => {
    const { data: newMemo } = await client.models.InsightMemo.create({
      bookId: data.bookId,
      type: data.type,
      content: data.content,
      sourcePage: data.sourcePage,
      pinned: false,
    });

    if (newMemo) {
      setMemos(prev => [newMemo, ...prev]);

      // Update memo count
      if (book) {
        await client.models.Book.update({
          id: book.id,
          memoCount: (book.memoCount || 0) + 1,
          lastMemoAt: new Date().toISOString(),
        });
        setBook({ ...book, memoCount: (book.memoCount || 0) + 1 });
      }

      showToast('メモを追加しました', 'success');
    }
  };

  // Delete memo
  const handleDeleteMemo = async (memoId: string) => {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    try {
      await client.models.InsightMemo.delete({ id: memoId });
      setMemos(prev => prev.filter(m => m.id !== memoId));

      // Update memo count
      if (book) {
        await client.models.Book.update({
          id: book.id,
          memoCount: Math.max(0, (book.memoCount || 1) - 1),
        });
        setBook({ ...book, memoCount: Math.max(0, (book.memoCount || 1) - 1) });
      }

      showToast('メモを削除しました', 'success', {
        label: '元に戻す',
        onClick: async () => {
          // Undo: recreate memo
          const { data: restored } = await client.models.InsightMemo.create({
            bookId: memo.bookId,
            type: memo.type,
            content: memo.content,
            sourcePage: memo.sourcePage,
            pinned: memo.pinned,
          });
          if (restored) {
            setMemos(prev => [restored, ...prev]);
            if (book) {
              setBook({ ...book, memoCount: (book.memoCount || 0) + 1 });
            }
          }
        },
      });
    } catch (error) {
      console.error('Failed to delete memo:', error);
      showToast('メモの削除に失敗しました', 'error');
    }
  };

  // Pin/unpin memo
  const handlePinMemo = async (memoId: string) => {
    const memo = memos.find(m => m.id === memoId);
    if (!memo) return;

    try {
      await client.models.InsightMemo.update({
        id: memoId,
        pinned: !memo.pinned,
      });

      setMemos(prev => {
        const updated = prev.map(m =>
          m.id === memoId ? { ...m, pinned: !m.pinned } : m
        );
        // Re-sort
        return updated.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });

      showToast(memo.pinned ? 'ピンを解除しました' : 'ピン留めしました', 'success');
    } catch (error) {
      console.error('Failed to pin memo:', error);
    }
  };

  // Delete book
  const handleDeleteBook = async () => {
    if (!book) return;

    if (!confirm(`「${book.title}」を削除しますか？関連するメモもすべて削除されます。`)) {
      return;
    }

    try {
      // Delete all memos first
      await Promise.all(memos.map(m => client.models.InsightMemo.delete({ id: m.id })));

      // Delete book-tag associations
      const { data: bookTags } = await client.models.BookTag.list({
        filter: { bookId: { eq: bookId } },
      });
      await Promise.all(bookTags.map(bt => client.models.BookTag.delete({ id: bt.id })));

      // Delete the book
      await client.models.Book.delete({ id: book.id });

      showToast(`「${book.title}」を削除しました`, 'success');
      router.push('/');
    } catch (error) {
      console.error('Failed to delete book:', error);
      showToast('本の削除に失敗しました', 'error');
    }
  };

  if (isLoading || !book) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>読み込み中...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/')}>
          ← 戻る
        </button>
        <button className={styles.deleteButton} onClick={handleDeleteBook}>
          🗑️
        </button>
      </header>

      {/* Book Info */}
      <motion.section
        className={styles.bookInfo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.bookTitle}>{book.title}</h1>
        {book.author && <p className={styles.bookAuthor}>{book.author}</p>}

        <button
          className={`${styles.statusBadge} ${styles[book.status?.toLowerCase() || 'to_read']}`}
          onClick={() => setStatusSheetOpen(true)}
        >
          {STATUS_LABELS[book.status as BookStatus || 'TO_READ']}
          <span className={styles.statusArrow}>▼</span>
        </button>

        {tags.length > 0 ? (
          <div className={styles.tags}>
            {tags.map(tag => (
              <TagChip key={tag.id} name={tag.name} color={tag.color || undefined} />
            ))}
            <button
              className={styles.addTagButton}
              onClick={() => setTagModalOpen(true)}
              aria-label="タグを編集"
            >
              +
            </button>
          </div>
        ) : (
          <button
            className={styles.addTagTextButton}
            onClick={() => setTagModalOpen(true)}
          >
            + タグを追加
          </button>
        )}
      </motion.section>

      {/* Memo Section */}
      <section className={styles.memoSection}>
        <div className={styles.memoHeader}>
          <h2 className={styles.sectionTitle}>インサイトメモ</h2>
          <span className={styles.memoCount}>{memos.length}件</span>
        </div>

        <div className={styles.memoFilter}>
          <SegmentControl
            segments={memoTypeSegments}
            value={memoFilter}
            onChange={setMemoFilter}
            size="sm"
          />
        </div>

        {filteredMemos.length === 0 ? (
          <EmptyMemos onAddMemo={() => setMemoModalOpen(true)} />
        ) : (
          <motion.div className={styles.memoList} layout>
            <AnimatePresence mode="popLayout">
              {filteredMemos.map(memo => (
                <MemoCard
                  key={memo.id}
                  id={memo.id}
                  type={memo.type as MemoType}
                  content={memo.content}
                  sourcePage={memo.sourcePage}
                  pinned={memo.pinned || false}
                  createdAt={memo.createdAt}
                  onPin={() => handlePinMemo(memo.id)}
                  onDelete={() => handleDeleteMemo(memo.id)}
                  onEdit={() => {
                    setEditingMemo(memo);
                    setMemoModalOpen(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* FAB */}
      <FAB
        icon="📝"
        onClick={() => setMemoModalOpen(true)}
        aria-label="メモを追加"
      />

      {/* Status Bottom Sheet */}
      <StatusBottomSheet
        isOpen={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        currentStatus={book.status as BookStatus || 'TO_READ'}
        onStatusChange={handleStatusChange}
        bookTitle={book.title}
      />

      {/* Tag Edit Modal */}
      <TagEditModal
        isOpen={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        bookId={bookId}
        bookTitle={book.title}
        initialTagIds={tags.map(t => t.id)}
        onTagsUpdated={fetchTags}
      />

      {/* Add Memo Modal */}
      <AddMemoModal
        isOpen={memoModalOpen}
        onClose={() => {
          setMemoModalOpen(false);
          setEditingMemo(null);
        }}
        bookId={bookId}
        bookTitle={book.title}
        onSubmit={handleAddMemo}
        initialData={editingMemo ? {
          type: editingMemo.type as MemoType,
          content: editingMemo.content,
          sourcePage: editingMemo.sourcePage || undefined,
        } : undefined}
        isEditing={!!editingMemo}
      />
    </div>
  );
}

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <Authenticator>
      <BookDetailContent bookId={resolvedParams.id} />
    </Authenticator>
  );
}
