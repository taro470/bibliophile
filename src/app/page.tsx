'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Authenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import styles from './page.module.css';
import {
  DndContext, DragEndEvent, pointerWithin,
  TouchSensor, MouseSensor, useSensor, useSensors, useDroppable
} from '@dnd-kit/core';
import { DraggableBookCard, DroppableFolderCard } from '@/components/dnd';
import { Book, BookOpen, CheckCircle, Folder, Trash2 } from 'lucide-react';

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

type BookModel = Schema['Book']['type'];
type Tag = Schema['Tag']['type'];
type FolderModel = Schema['Folder']['type'];

const statusSegments = [
  { value: 'TO_READ' as BookStatus, label: '読みたい', icon: <Book size={18} color="#8b5cf6" /> },
  { value: 'READING' as BookStatus, label: '読んでいる', icon: <BookOpen size={18} color="#8b5cf6" /> },
  { value: 'READ' as BookStatus, label: '読んだ', icon: <CheckCircle size={18} color="#8b5cf6" /> },
];

function DroppableBackArea({
  children,
  onClick
}: {
  children: React.ReactNode,
  onClick: () => void
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'ROOT',
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        margin: '-8px -12px',
        borderRadius: '8px',
        backgroundColor: isOver ? 'rgba(139, 92, 246, 0.2)' : 'transparent', // Purple tint
        border: isOver ? '2px dashed #8b5cf6' : '2px solid transparent',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
    >
      {children}
      {isOver && (
        <span style={{
          marginLeft: '12px',
          color: '#8b5cf6',
          fontWeight: 'bold',
          pointerEvents: 'none'
        }}>
          ドロップしてフォルダから出す
        </span>
      )}
    </div>
  );
}

function HomeContent() {
  const { user, signOut } = useAuthenticator();
  const { showToast } = useToast();

  // State
  const [books, setBooks] = useState<BookModel[]>([]);
  const [folders, setFolders] = useState<FolderModel[]>([]);
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
  const [selectedBook, setSelectedBook] = useState<BookModel | null>(null);
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

  // Status counts
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
      // If book is in a folder via currentFolderId, check if folder status matches newStatus
      let newFolderId = selectedBook.folderId;

      // If the book moves to a different status, and current folder belongs to old status,
      // the book should NOT stay in that folder (as folders are status-specific).
      // We essentially kick it out to Root of the new status.
      if (newStatus !== activeStatus && selectedBook.folderId) {
        // If folder status is tied to activeStatus (which it is visually),
        // then moving status implies moving out of this folder.
        // Note: Ideally check folder.status explicitly, but UI enforces folders are strict.
        newFolderId = null;
      }

      await client.models.Book.update({
        id: selectedBook.id,
        status: newStatus,
        folderId: newFolderId
      });

      setBooks((prev) =>
        prev.map((b) =>
          b.id === selectedBook.id ? { ...b, status: newStatus, folderId: newFolderId } : b
        )
      );

      const statusLabel = STATUS_LABELS[newStatus];
      showToast(`「${selectedBook.title}」を${statusLabel}に変更しました`, 'success');
    } catch (error) {
      console.error('Failed to update status:', error);
      showToast('ステータスの変更に失敗しました', 'error');
    }
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!confirm(`タグ「${tagName}」を削除してもよろしいですか？`)) return;

    try {
      // 1. Delete relations locally first for UI responsiveness
      setBookTags(prev => prev.filter(bt => bt.tagId !== tagId));
      setTags(prev => prev.filter(t => t.id !== tagId));
      if (selectedTagId === tagId) setSelectedTagId(null);

      // 2. Delete from backend
      // First delete all BookTag relations (Amplify/DynamoDB doesn't always cascade)
      // Actually strictly speaking we should query them.
      // But assuming cascade or manual cleanup. Let's just delete the tag.
      // Ideally delete BookTags first.
      const bookTagsToDelete = bookTags.filter(bt => bt.tagId === tagId);
      await Promise.all(bookTagsToDelete.map(bt => client.models.BookTag.delete({ id: bt.id })));
      await client.models.Tag.delete({ id: tagId });

      showToast('タグを削除しました', 'success');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      showToast('タグの削除に失敗しました', 'error');
      // Ideally revert state here, but skipping for brevity
      fetchTags(); // Refetch to be safe
    }
  };

  const openStatusSheet = (book: BookModel, e: React.MouseEvent) => {
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
    const targetId = over.id as string;

    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Determine new Folder ID
    let newFolderId: string | null = null;
    if (targetId === 'ROOT') {
      newFolderId = null;
      if (!book.folderId) return; // Already in root
    } else {
      newFolderId = targetId;
      if (book.folderId === newFolderId) return; // Same folder
    }

    // Check if target is actually a folder (or ROOT)
    if (targetId !== 'ROOT' && !folders.find(f => f.id === targetId)) return;

    // Optimistic Update
    const originalFolderId = book.folderId;
    setBooks(prev => prev.map(b =>
      b.id === bookId ? { ...b, folderId: newFolderId } : b
    ));

    const message = newFolderId
      ? `「${book.title}」をフォルダに移動しました`
      : `「${book.title}」をフォルダから出しました`;
    showToast(message, 'success');

    try {
      await client.models.Book.update({
        id: bookId,
        folderId: newFolderId,
      });
      fetchFolders();
    } catch (error) {
      console.error('Failed to move book:', error);
      showToast('移動に失敗しました', 'error');
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
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragEnd={handleDragEnd}
    >
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
                <div key={tag.id} className="relative group">
                  <TagChip
                    name={tag.name}
                    color={tag.color || undefined}
                    isActive={selectedTagId === tag.id}
                    onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                  />
                  {/* Delete Tag Button (Long press or small X would be better for mobile, but here using a small overlay) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTag(tag.id, tag.name);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Breadcrumb Navigation */}
          {currentFolderId && (
            <div className={styles.breadcrumb}>
              <DroppableBackArea onClick={() => setCurrentFolderId(null)}>
                <button className={styles.backButton}>
                  ← 戻る｜{currentFolder?.name || 'フォルダ'}
                </button>
              </DroppableBackArea>
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
            <div className={styles.contentGrid}>
              {/* Folders */}
              {filteredFolders.length > 0 && (
                <motion.div className={styles.grid}>
                  {filteredFolders.map((folder) => {
                    // Live Count Calculation
                    const count = books.filter(b => b.folderId === folder.id).length;
                    return (
                      <DroppableFolderCard
                        key={folder.id}
                        id={folder.id}
                        disabled={!!currentFolderId}
                      >
                        <FolderCard
                          id={folder.id}
                          name={folder.name}
                          color={folder.color || undefined}
                          bookCount={count}
                          onClick={() => setCurrentFolderId(folder.id)}
                        />
                      </DroppableFolderCard>
                    );
                  })}
                </motion.div>
              )}

              {/* Books */}
              {filteredBooks.length === 0 && filteredFolders.length === 0 ? (
                searchQuery ? (
                  <EmptySearch />
                ) : (
                  <EmptyBooks onAddBook={() => window.location.href = '/books/new'} />
                )
              ) : (
                <>
                  {filteredFolders.length > 0 && filteredBooks.length > 0 && (
                    <h2 className={styles.sectionTitle}>本</h2>
                  )}
                  <motion.div className={styles.grid}>
                    <AnimatePresence mode="wait" initial={false}>
                      {filteredBooks.map((book) => (
                        <DraggableBookCard key={book.id} id={book.id}>
                          <BookCard
                            id={book.id}
                            title={book.title}
                            author={book.author}
                            status={book.status as BookStatus}
                            memoCount={book.memoCount || 0}
                            onStatusClick={(e) => openStatusSheet(book, e)}
                            updatedAt={book.updatedAt}
                          />
                        </DraggableBookCard>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </>
              )}
            </div>
          )}
        </main>

        {/* Speed Dial FAB */}
        <SpeedDial actions={speedDialActions} />

        {/* Status Bottom Sheet */}
        <StatusBottomSheet
          isOpen={statusSheetOpen}
          onClose={() => setStatusSheetOpen(false)}
          currentStatus={(selectedBook?.status as BookStatus) || 'TO_READ'}
          onStatusChange={handleStatusChange}
          bookTitle={selectedBook?.title}
        />

        {/* Create Folder Modal */}
        <CreateFolderModal
          isOpen={folderModalOpen}
          onClose={() => setFolderModalOpen(false)}
          onSubmit={handleCreateFolder}
          initialStatus={activeStatus}
        />
      </div>
    </DndContext>
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
