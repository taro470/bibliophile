import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

// ステータスの定義
const BookStatus = ['TO_READ', 'READING', 'READ'] as const;
const MemoType = ['SUMMARY', 'QUOTE', 'DATA'] as const;

const schema = a.schema({
  // Book: 本の基本情報
  Book: a
    .model({
      title: a.string().required(),
      author: a.string(),
      status: a.enum(BookStatus),
      lastMemoAt: a.datetime(),
      memoCount: a.integer().default(0),
      // Relations
      memos: a.hasMany('InsightMemo', 'bookId'),
      bookTags: a.hasMany('BookTag', 'bookId'),
      folderId: a.id(),
      folder: a.belongsTo('Folder', 'folderId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Folder: 本をまとめるフォルダ
  Folder: a
    .model({
      name: a.string().required(),
      status: a.enum(BookStatus),
      color: a.string(),
      books: a.hasMany('Book', 'folderId'),
    })
    .authorization((allow) => [allow.owner()]),

  // InsightMemo: 本に紐づくメモ
  InsightMemo: a
    .model({
      bookId: a.id().required(),
      type: a.enum(MemoType),
      content: a.string().required(),
      sourcePage: a.string(),
      pinned: a.boolean().default(false),
      // Relations
      book: a.belongsTo('Book', 'bookId'),
    })
    .authorization((allow) => [allow.owner()]),

  // Tag: タグマスタ
  Tag: a
    .model({
      name: a.string().required(),
      color: a.string(),
      // Relations
      bookTags: a.hasMany('BookTag', 'tagId'),
    })
    .authorization((allow) => [allow.owner()]),

  // BookTag: 本とタグの中間テーブル（多対多）
  BookTag: a
    .model({
      bookId: a.id().required(),
      tagId: a.id().required(),
      // Relations
      book: a.belongsTo('Book', 'bookId'),
      tag: a.belongsTo('Tag', 'tagId'),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
