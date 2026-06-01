'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { api, type ApiResponse } from '@/lib/api';
import { MOCK_FOLDERS } from '@/mock/mockfile';
import type { Folder } from '@hybridshare/shared/types/file';

interface FolderTreeProps {
  onFolderSelect?: (folderId: string | null) => void;
  selectedFolderId?: string | null;
}

interface FolderNode extends Folder {
  children?: FolderNode[];
}

function buildTree(folders: Folder[]): FolderNode[] {
  const map = new Map<string, FolderNode>();
  const roots: FolderNode[] = [];

  folders.forEach((f) => map.set(f.id, { ...f, children: [] }));
  folders.forEach((f) => {
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children!.push(map.get(f.id)!);
    } else {
      roots.push(map.get(f.id)!);
    }
  });

  return roots;
}

function FolderNode({
  folder,
  depth,
  selectedId,
  onSelect,
}: {
  folder: FolderNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = (folder.children?.length ?? 0) > 0;

  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all duration-150 group text-sm',
          selectedId === folder.id
            ? 'bg-brand-red-muted text-brand-red font-semibold'
            : 'text-brand-gray-dark hover:bg-brand-white-soft hover:text-brand-black'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          onSelect(folder.id);
          if (hasChildren) setExpanded((v) => !v);
        }}
      >
        {hasChildren ? (
          <svg
            className={cn(
              'w-3 h-3 flex-shrink-0 transition-transform duration-150',
              expanded ? 'rotate-90' : ''
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          fill={selectedId === folder.id ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <span className="truncate text-xs">{folder.name}</span>
        {folder.fileCount !== undefined && folder.fileCount > 0 && (
          <span className="ml-auto text-[9px] text-brand-gray-dark">{folder.fileCount}</span>
        )}
      </button>

      {expanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ onFolderSelect, selectedFolderId }: FolderTreeProps) {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(selectedFolderId ?? null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<Folder[]>>('/folders')
      .then((r) => setFolders(buildTree(r.data.data ?? [])))
      .catch(() => setFolders(buildTree(MOCK_FOLDERS)))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSelect = (id: string | null) => {
    setSelectedId(id);
    onFolderSelect?.(id);
  };

  return (
    <div className="card p-3 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest">
          Folders
        </span>
        <button
          className="icon-btn w-5 h-5 p-0"
          title="New folder"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <button
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all duration-150 text-xs mb-1',
          selectedId === null
            ? 'bg-brand-red-muted text-brand-red font-semibold'
            : 'text-brand-gray-dark hover:bg-brand-white-soft hover:text-brand-black'
        )}
        onClick={() => handleSelect(null)}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        All Files
      </button>

      {isLoading ? (
        <div className="space-y-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-7 bg-brand-gray animate-pulse rounded-lg" style={{ width: `${80 - i * 10}%` }} />
          ))}
        </div>
      ) : folders.length === 0 ? (
        <p className="text-xs text-brand-gray-dark px-2 py-2">No folders yet</p>
      ) : (
        folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            depth={0}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        ))
      )}
    </div>
  );
}
