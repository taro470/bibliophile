// 型定義を別途インポートするため、ここでは直接Schemaを使わない
// Amplify sandbox実行後に型が生成される

// Book Types
export type BookStatus = 'TO_READ' | 'READING' | 'READ';

export const STATUS_LABELS: Record<BookStatus, string> = {
  TO_READ: '読みたい',
  READING: '読んでいる',
  READ: '読んだ',
};

export const STATUS_COLORS: Record<BookStatus, string> = {
  TO_READ: 'status-to-read',
  READING: 'status-reading',
  READ: 'status-read',
};

// InsightMemo Types
export type MemoType = 'SUMMARY' | 'QUOTE' | 'DATA';

export const MEMO_LABELS: Record<MemoType, string> = {
  SUMMARY: '要約',
  QUOTE: '引用',
  DATA: 'データ',
};

export const MEMO_ICONS: Record<MemoType, string> = {
  SUMMARY: '📝',
  QUOTE: '💬',
  DATA: '📊',
};

export const MEMO_COLORS: Record<MemoType, string> = {
  SUMMARY: 'memo-summary',
  QUOTE: 'memo-quote',
  DATA: 'memo-data',
};

// Form Types
export interface BookFormData {
  title: string;
  author?: string;
  status: BookStatus;
  tagIds?: string[];
}

export interface MemoFormData {
  bookId: string;
  type: MemoType;
  content: string;
  sourcePage?: string;
  pinned?: boolean;
}

export interface TagFormData {
  name: string;
  color?: string;
}
