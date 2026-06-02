'use client';

import { cn } from '@/lib/utils';
import { FileIcon } from './FileIcon';
import { FileSizeLabel } from './FileSizeLabel';
import { Avatar } from '@/components/ui/Avatar';
import type { LFSFile } from '@/types/lfs';

interface Props {
  file: LFSFile;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onOpen?: (file: LFSFile) => void;
  requiresAuth?: boolean;
}

export function FileListRow({ file, isSelected, onSelect, onOpen, requiresAuth }: Props) {
  const handleOpen = () => {
    if (requiresAuth && file.fileType === 'video') return;
    onOpen?.(file);
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-4 py-2.5 hover:bg-brand-white-soft transition-colors cursor-pointer border-b border-brand-gray last:border-0',
        isSelected && 'bg-brand-red/5',
      )}
      onClick={handleOpen}
    >
      {/* Checkbox */}
      <button
        type="button"
        aria-label="Select file"
        onClick={(e) => { e.stopPropagation(); onSelect?.(file.id); }}
        className={cn(
          'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
          isSelected ? 'bg-brand-red border-brand-red' : 'border-brand-gray bg-white',
        )}
      >
        {isSelected && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
      </button>

      <FileIcon extension={file.extension} size="sm" />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-brand-black truncate group-hover:text-brand-red transition-colors">{file.name}</p>
          {file.isLocked && <span className="text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">Locked</span>}
          {file.tags.slice(0, 1).map((t) => (
            <span key={t} className="text-[9px] bg-brand-white-soft border border-brand-gray px-1.5 py-0.5 rounded-full text-brand-gray-dark hidden sm:block flex-shrink-0">{t}</span>
          ))}
        </div>
      </div>

      {/* Video lock indicator */}
      {file.fileType === 'video' && requiresAuth && (
        <span className="text-[10px] text-brand-gray-dark flex items-center gap-1 flex-shrink-0 hidden md:flex">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          Sign in to play
        </span>
      )}

      {/* Version */}
      <span className="text-xs text-brand-gray-dark w-10 text-center hidden lg:block">v{file.version}</span>

      {/* Modified by */}
      <div className="hidden md:flex items-center gap-1.5 w-32 flex-shrink-0">
        <Avatar name={file.updatedBy?.name ?? file.createdBy.name} size="xs" />
        <span className="text-xs text-brand-gray-dark truncate">{file.updatedBy?.name ?? file.createdBy.name}</span>
      </div>

      {/* Size */}
      <FileSizeLabel bytes={file.sizeBytes} className="text-xs text-brand-gray-dark w-16 text-right hidden sm:block flex-shrink-0" />

      {/* Date */}
      <span className="text-xs text-brand-gray-dark w-20 text-right flex-shrink-0">
        {new Date(file.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button type="button" aria-label="Download" className="icon-btn w-7 h-7 p-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        </button>
        <button type="button" aria-label="Share file" className="icon-btn w-7 h-7 p-0">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
        <button type="button" aria-label="More options" className="icon-btn w-7 h-7 p-0">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
        </button>
      </div>
    </div>
  );
}
