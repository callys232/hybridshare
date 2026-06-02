'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { FileIcon } from './FileIcon';
import { FileSizeLabel } from './FileSizeLabel';
import type { LFSFile } from '@/types/lfs';

interface Props {
  file: LFSFile;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (file: LFSFile) => void;
  onStar?: (id: string) => void;
  requiresAuth?: boolean;
}

export function FileGridCard({ file, isSelected, onSelect, onOpen, onStar, requiresAuth }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [starPop, setStarPop] = useState(false);

  const handleOpen = () => {
    if (requiresAuth && file.fileType === 'video') return;
    onOpen?.(file);
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStarPop(true);
    setTimeout(() => setStarPop(false), 400);
    onStar?.(file.id);
  };

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-dark-surface-1 border rounded-xl p-3 cursor-pointer select-none',
        'transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-card-hover dark:hover:shadow-card-hover-dark',
        'active:scale-[0.98] active:translate-y-0',
        isSelected
          ? 'border-brand-red ring-2 ring-brand-red/20 shadow-[0_0_0_3px_rgba(193,33,41,0.08)]'
          : 'border-brand-gray dark:border-dark-border hover:border-brand-gray-dark dark:hover:border-dark-border-soft',
      )}
      onClick={handleOpen}
    >
      {/* Checkbox — pops in on hover/select */}
      <button
        type="button"
        aria-label="Select file"
        onClick={(e) => { e.stopPropagation(); onSelect?.(file.id); }}
        className={cn(
          'absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center z-10',
          'transition-all duration-150',
          isSelected
            ? 'bg-brand-red border-brand-red opacity-100 scale-100'
            : 'border-brand-gray bg-white dark:bg-dark-surface-2 opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100',
        )}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white animate-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Star — animates on click */}
      <button
        type="button"
        aria-label={file.isStarred ? 'Unstar file' : 'Star file'}
        onClick={handleStar}
        className={cn(
          'absolute top-2 right-8 z-10 transition-all duration-150',
          starPop && 'animate-pop',
          file.isStarred
            ? 'opacity-100 text-amber-400 scale-110'
            : 'opacity-0 group-hover:opacity-100 text-brand-gray-dark hover:text-amber-400 hover:scale-110',
        )}
      >
        <svg className="w-4 h-4" fill={file.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>

      {/* Context menu trigger */}
      <div className="absolute top-2 right-2 z-10">
        <button
          type="button"
          aria-label="File options"
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className={cn(
            'transition-all duration-150 p-0.5 rounded hover:bg-brand-white-soft dark:hover:bg-dark-surface-2',
            'text-brand-gray-dark hover:text-brand-black dark:hover:text-dark-text',
            'hover:scale-110 active:scale-95',
            menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-6 w-44 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl shadow-dropdown py-1 z-50 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="dropdown-item w-full text-left" onClick={() => { onOpen?.(file); setMenuOpen(false); }}>Open</button>
            <button type="button" className="dropdown-item w-full text-left">Download</button>
            <button type="button" className="dropdown-item w-full text-left">Share</button>
            <button type="button" className="dropdown-item w-full text-left">Rename</button>
            <button type="button" className="dropdown-item w-full text-left">Move</button>
            <button type="button" className="dropdown-item w-full text-left">Version history</button>
            <div className="divider my-1" />
            <button type="button" className="dropdown-item-danger w-full text-left">Delete</button>
          </div>
        )}
      </div>

      {/* Thumbnail */}
      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-brand-white-soft dark:bg-dark-surface-2 mb-3 flex items-center justify-center relative">
        {file.thumbnailUrl && file.fileType === 'image' ? (
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="transition-transform duration-200 group-hover:scale-110">
            <FileIcon extension={file.extension} size="lg" />
          </div>
        )}
        {file.fileType === 'video' && requiresAuth && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-white/70 text-[10px] font-semibold">Sign in to play</span>
            </div>
          </div>
        )}
        {file.isLocked && (
          <div className="absolute bottom-1 right-1 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pop">
            Locked
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs font-semibold text-brand-black dark:text-dark-text truncate mb-0.5 group-hover:text-brand-red transition-colors duration-150">
        {file.name}
      </p>
      <div className="flex items-center justify-between text-[10px] text-brand-gray-dark dark:text-dark-text-muted">
        <FileSizeLabel bytes={file.sizeBytes} />
        <span>{new Date(file.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
      </div>
      {file.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {file.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              className="text-[9px] bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border px-1.5 py-0.5 rounded-full text-brand-gray-dark dark:text-dark-text-muted transition-colors duration-150 hover:border-brand-gray-dark hover:text-brand-black dark:hover:text-dark-text cursor-default"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
