'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from './page.module.css';
import {
  DndContext, DragEndEvent, closestCenter,
  TouchSensor, MouseSensor, useSensor, useSensors
} from '@dnd-kit/core';
import { DraggableBookCard, DroppableFolderCard } from '@/components/dnd';

// Components
import {
  Button, SearchInput, SegmentControl,
  TagChip, EmptyBooks, EmptySearch, BookCardSkeleton,
  useToast, SpeedDial
} from '@/components/ui';
import { BookCard, StatusBottomSheet } from '@/components/book';
import { FolderCard, CreateFolderModal } from '@/components/folder';
import { BookStatus, STATUS_LABELS } from '@/types';

const client = generateClient<Schema>();

type Book = Schema['Book']['type'];
type Tag = Schema['Tag']['type'];
type Folder = Schema['Folder']['type'];

const statusSegments = [
  { value: 'TO_READ' as BookStatus, label: '読みたい', icon: '📚' },
  { value: 'READING' as BookStatus, label: '読んでいる', icon: '📖' },
  { value: 'READ' as BookStatus, label: '読んだ', icon: '✅' },
];

function HomeContent() {
  const { user, signOut } = useAuthenticator();
  const { showToast } = useToast();

  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [bookTags, setBookTags] = useState<Schema['BookTag']['type'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<BookStatus>('READING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Folder Navigation State
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  // Modals
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [folderModalOpen, setFolderModalOpen] = useState(false);

  // D&D Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    try {
      const { data } = await client.models.Folder.list({});
      setFolders(data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  }, []);

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
      await Promise.all([fetchBooks(), fetchFolders(), fetchTags()]);
      setIsLoading(false);
    };
    init();
  }, [fetchBooks, fetchFolders, fetchTags]);

  // Derived State
  const currentFolder = useMemo(() =>
    folders.find(f => f.id === currentFolderId),
    [folders, currentFolderId]
  );

  // Filter Folders
  const filteredFolders = useMemo(() => {
    // フォルダ内にはフォルダを表示しない（1階層のみの仕様）
    if (currentFolderId) return [];

    return folders.filter(f => f.status === activeStatus);
  }, [folders, activeStatus, currentFolderId]);

  // Filter books
  const filteredBooks = useMemo(() => {
    let result = books.filter((book) => book.status === activeStatus);

    // Folder Filter
    if (currentFolderId) {
      result = result.filter(b => b.folderId === currentFolderId);
    } else {
      // Root: show books without folder
      result = result.filter(b => !b.folderId);
    }

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
  }, [books, activeStatus, searchQuery, selectedTagId, bookTags, currentFolderId]);

  // Status counts (Global counts, roughly)
  const statusCounts = useMemo(() => {
    return {
      TO_READ: books.filter((b) => b.status === 'TO_READ').length,
      READING: books.filter((b) => b.status === 'READING').length,
      READ: books.filter((b) => b.status === 'READ').length,
    };
  }, [books]);

  // Handlers
  const handleCreateFolder = async (name: string, status: BookStatus, color: string) => {
    try {
      const { data: newFolder } = await client.models.Folder.create({
        name,
        status,
        color,
      });
      if (newFolder) {
        setFolders(prev => [...prev, newFolder]);
        showToast('フォルダを作成しました', 'success');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  };

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

  // Handle Drag End
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const bookId = active.id as string;
    const folderId = over.id as string;

    // Verify IDs (simple check)
    const book = books.find(b => b.id === bookId);
    if (!book || book.folderId === folderId) return;

    // Optimistic Update
    const originalFolderId = book.folderId;
    setBooks(prev => prev.map(b =>
      b.id === bookId ? { ...b, folderId: folderId } : b
    ));
    showToast('本を移動しました', 'success');

    try {
      await client.models.Book.update({
        id: bookId,
        folderId: folderId,
      });
      // Refresh counts if needed
      fetchFolders();
    } catch (error) {
      console.error('Failed to move book:', error);
      showToast('移動に失敗しました', 'error');
      // Revert
      setBooks(prev => prev.map(b =>
        b.id === bookId ? { ...b, folderId: originalFolderId } : b
      ));
    }
  };

  const segmentsWithCount = statusSegments.map((s) => ({
    ...s,
    count: statusCounts[s.value],
  }));

  // Speed Dial Actions
  const speedDialActions = [
    {
      label: '本を追加',
      icon: <span style={{ fontSize: '20px' }}>📖</span>,
      onClick: () => window.location.href = `/books/new${currentFolderId ? `?folderId=${currentFolderId}` : ''}`,
    },
    {
      label: 'フォルダを作成',
      icon: <span style={{ fontSize: '20px' }}>📁</span>,
      onClick: () => setFolderModalOpen(true),
    },
  ];

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
            onChange={(status) => {
              setActiveStatus(status);
              setCurrentFolderId(null); // Reset folder nav on status change
            }}
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

        {/* Breadcrumb Navigation */}
        {currentFolderId && (
          <div className={styles.breadcrumb}>
            <button
              className={styles.backButton}
              onClick={() => setCurrentFolderId(null)}
            >
              ← 戻る｜{currentFolder?.name || 'フォルダ'}
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.grid}>
            {[...Array(6)].map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className={styles.contentGrid}>
              {/* Folders */}
              {filteredFolders.length > 0 && (
                <motion.div className={styles.grid}>
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
          </>
        )}
    </div>
  )
}
      </main >

  {/* Speed Dial FAB */ }
  < SpeedDial actions = { speedDialActions } />

    {/* Status Bottom Sheet */ }
    < StatusBottomSheet
isOpen = { statusSheetOpen }
onClose = {() => setStatusSheetOpen(false)}
currentStatus = {(selectedBook?.status as BookStatus) || 'TO_READ'}
onStatusChange = { handleStatusChange }
bookTitle = { selectedBook?.title }
  />

  {/* Create Folder Modal */ }
  < CreateFolderModal
isOpen = { folderModalOpen }
onClose = {() => setFolderModalOpen(false)}
onSubmit = { handleCreateFolder }
initialStatus = { activeStatus }
  />
    </div >
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
