import React, { useState } from 'react';
import { Modal, BottomSheet, Button, Input } from '@/components/ui';
import { Trash2, Tag, Plus } from 'lucide-react';

interface TagData {
  id: string;
  name: string;
  color?: string | null;
}

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tags: TagData[];
  onDeleteTag: (tagId: string, tagName: string) => Promise<void>;
  onCreateTag: (tagName: string) => Promise<void>;
}

export function TagManagementModal({
  isOpen,
  onClose,
  tags,
  onDeleteTag,
  onCreateTag,
}: TagManagementModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleDelete = async (tag: TagData) => {
    setDeletingId(tag.id);
    await onDeleteTag(tag.id, tag.name);
    setDeletingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    setIsCreating(true);
    await onCreateTag(newTagName.trim());
    setNewTagName('');
    setIsCreating(false);
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh' }}>
      {/* Create Form */}
      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px' }}>
        <Input
          placeholder="新しいタグ名"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          disabled={isCreating}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!newTagName.trim() || isCreating}
          isLoading={isCreating}
        >
          <Plus size={20} />
        </Button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1 }}>
        {tags.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            タグがありません
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={16} color={tag.color || '#6B7280'} />
                <span style={{ fontWeight: 500 }}>{tag.name}</span>
              </div>
              <button
                onClick={() => handleDelete(tag)}
                disabled={deletingId === tag.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  opacity: deletingId === tag.id ? 0.5 : 1,
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
        <Button variant="ghost" onClick={onClose}>
          閉じる
        </Button>
      </div>
    </div>
  );

  if (typeof window !== 'undefined' && window.innerWidth < 640) {
    return (
      <BottomSheet isOpen={isOpen} onClose={onClose} title="タグ管理">
        {content}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="タグ管理">
      {content}
    </Modal>
  );
}
