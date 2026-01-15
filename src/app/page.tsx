'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from './page.module.css';

// Components
import {
  Button, FAB, SearchInput, SegmentControl,
  TagChip, EmptyBooks, EmptySearch, BookCardSkeleton,
  useToast
} from '@/components/ui';
import { BookCard, StatusBottomSheet } from '@/components/book';
import { BookStatus, STATUS_LABELS } from '@/types';

const client = generateClient<Schema>();

type Book = Schema['Book']['type'];
type Tag = Schema['Tag']['type'];

const statusSegments = [
  { value: 'TO_READ' as BookStatus, label: '読みたい', icon: '📚' },
  { value: 'READING' as BookStatus, label: '読んでいる', icon: '📖' },
  { value: 'READ' as BookStatus, label: '読んだ', icon: '✅' },
];

function HomeContent() {
  const { user, signOut } = useAuthenticator();
  const { showToast } = useToast();

  // State
  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookTags, setBookTags] = useState<Schema['BookTag']['type'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BookStatus>('READING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Status change sheet
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    try {
      const { data } = await client.models.Book.list({});
      setBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
      showToast('本の取得に失敗しました', 'error');
    }
  }, [showToast]);

  // Fetch tags and bookTags
  const fetchTags = useCallback(async () => {
    try {
      const [tagsRes, bookTagsRes] = await Promise.all([
        client.models.Tag.list({}),
        client.models.BookTag.list({})
      ]);
      setTags(tagsRes.data);
      setBookTags(bookTagsRes.data);
    } catch (error) {
      console.error('Failed to fetch tags data:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchBooks(), fetchTags()]);
      setIsLoading(false);
    };
    init();
  }, [fetchBooks, fetchTags]);

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = books.filter((book) => book.status === activeStatus);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          (book.author && book.author.toLowerCase().includes(query))
      );
    }

    // Filter tags
    if (selectedTagId) {
      const validBookIds = new Set(
        bookTags
          .filter((bt) => bt.tagId === selectedTagId)
          .map((bt) => bt.bookId)
      );
      result = result.filter((book) => validBookIds.has(book.id));
    }

    return result;
  }, [books, activeStatus, searchQuery, selectedTagId, bookTags]);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      TO_READ: books.filter((b) => b.status === 'TO_READ').length,
      READING: books.filter((b) => b.status === 'READING').length,
      READ: books.filter((b) => b.status === 'READ').length,
    };
  }, [books]);

  // Handle status change
  const handleStatusChange = async (newStatus: BookStatus) => {
    if (!selectedBook) return;

    try {
      await client.models.Book.update({
        id: selectedBook.id,
        status: newStatus,
      });

      setBooks((prev) =>
        prev.map((b) =>
          b.id === selectedBook.id ? { ...b, status: newStatus } : b
        )
      );

      showToast(`「${selectedBook.title}」を${STATUS_LABELS[newStatus]}に変更しました`, 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('ステータスの変更に失敗しました', 'error');
    }
  };

  const openStatusSheet = (book: Book, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedBook(book);
    setStatusSheetOpen(true);
  };

  const segmentsWithCount = statusSegments.map((s) => ({
    ...s,
    count: statusCounts[s.value],
  }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.logo}>
            <h1 className={styles.logoText}>蔵書・インサイトメモ管理</h1>
          </div>
          <button className={styles.userButton} onClick={signOut}>
            👤
          </button>
        </div>

        {/* Search */}
        <div className={styles.searchWrapper}>
          <SearchInput
            placeholder="タイトル・著者で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* Status Toggle */}
        <div className={styles.segmentWrapper}>
          <SegmentControl
            segments={segmentsWithCount}
            value={activeStatus}
            onChange={setActiveStatus}
          />
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className={styles.tagsWrapper}>
            <TagChip
              name="すべて"
              isActive={!selectedTagId}
              onClick={() => setSelectedTagId(null)}
            />
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                name={tag.name}
                color={tag.color || undefined}
                isActive={selectedTagId === tag.id}
                onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
              />
            ))}
          </div>
        )}
      </header>

      {/* Book List */}
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          searchQuery ? (
            <EmptySearch />
          ) : (
            <EmptyBooks onAddBook={() => window.location.href = '/books/new'} />
          )
        ) : (
          <motion.div className={styles.grid}>
            <AnimatePresence mode="wait" initial={false}>
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  id={book.id}
                  title={book.title}
                  author={book.author}
                  status={book.status as BookStatus}
                  memoCount={book.memoCount || 0}
                  onStatusClick={(e) => openStatusSheet(book, e)}
                  updatedAt={book.updatedAt}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* FAB */}
      <FAB
        icon="+"
        onClick={() => window.location.href = '/books/new'}
        aria-label="本を追加"
      />

      {/* Status Bottom Sheet */}
      <StatusBottomSheet
        isOpen={statusSheetOpen}
        onClose={() => setStatusSheetOpen(false)}
        currentStatus={(selectedBook?.status as BookStatus) || 'TO_READ'}
        onStatusChange={handleStatusChange}
        bookTitle={selectedBook?.title}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Authenticator
      loginMechanisms={['email']}
      signUpAttributes={['email']}
      formFields={{
        signIn: {
          username: { label: 'メールアドレス', placeholder: 'mail@example.com' },
          password: { label: 'パスワード', placeholder: 'パスワードを入力' },
        },
        signUp: {
          email: { label: 'メールアドレス', placeholder: 'mail@example.com' },
          password: { label: 'パスワード', placeholder: 'パスワードを入力' },
          confirm_password: { label: 'パスワード確認', placeholder: 'パスワードを再入力' },
        },
      }}
    >
      <HomeContent />
    </Authenticator>
  );
}
