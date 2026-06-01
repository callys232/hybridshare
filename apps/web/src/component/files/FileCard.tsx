'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn, formatBytes, formatRelativeTime, getFileIcon, getFileIconColor } from '@/lib/utils';
import type { FileMetadata } from '@hybridshare/shared/types/file';
import { useFileStore } from '@/store/file.store';
import { Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';

interface FileCardProps {
  file: FileMetadata & { uploadedBy?: { id: string; name: string; avatar: string | null } };
  onPreview?: (file: FileMetadata) => void;
  selected?: boolean;
  onSelect?: (id: string, multi: boolean) => void;
}

export function FileCard({ file, onPreview, selected, onSelect }: FileCardProps) {
  const { toggleStar, deleteFile } = useFileStore();
  const [starring, setStarring] = useState(false);

  const iconType = getFileIcon(file.mimeType);
  const iconColor = getFileIconColor(file.mimeType);

  const handleStar = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setStarring(true);
    await toggleStar(file.id).finally(() => setStarring(false));
  };

  const menuItems = [
    {
      id: 'open',
      label: 'Open',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
      onClick: () => {},
    },
    {
      id: 'download',
      label: 'Download',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
      onClick: () => {},
    },
    {
      id: 'share',
      label: 'Share',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
      onClick: () => {},
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      onClick: () => deleteFile(file.id),
      danger: true,
      divider: true,
    },
  ];

  return (
    <div
      className={cn(
        'card card-hover group relative cursor-pointer transition-card duration-200',
        selected && 'ring-2 ring-brand-red shadow-card-active'
      )}
      onClick={(e) => {
        if ((e.target as Element).closest('[data-no-nav]')) return;
        onSelect?.(file.id, e.metaKey || e.ctrlKey);
      }}
    >
      {/* Selection checkbox */}
      <div
        data-no-nav
        className={cn(
          'absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center z-10',
          'transition-all duration-150',
          selected
            ? 'bg-brand-red border-brand-red opacity-100'
            : 'border-brand-gray bg-white opacity-0 group-hover:opacity-100'
        )}
        onClick={(e) => { e.stopPropagation(); onSelect?.(file.id, e.metaKey || e.ctrlKey); }}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* File preview area */}
      <Link href={`/files/${file.id}`} className="block p-4 pb-3">
        <div className="aspect-[4/3] rounded-lg bg-brand-white-soft flex items-center justify-center mb-3 overflow-hidden group-hover:bg-brand-gray/30 transition-colors duration-200">
          {file.thumbnailPath ? (
            <img
              src={`/api/files/${file.id}/preview`}
              alt={file.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <FileTypeIcon type={iconType} color={iconColor} />
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-brand-black truncate leading-tight" title={file.name}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-brand-gray-dark">
            <span>{formatBytes(file.size)}</span>
            <span>Â·</span>
            <span>{formatRelativeTime(file.updatedAt)}</span>
          </div>
        </div>
      </Link>

      {/* Footer actions */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {file.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            data-no-nav
            onClick={handleStar}
            disabled={starring}
            className={cn(
              'icon-btn w-7 h-7 p-0 transition-all duration-150',
              file.isStarred ? 'text-amber-400' : 'text-brand-gray-dark',
              'hover:text-amber-400 hover:scale-110'
            )}
            title={file.isStarred ? 'Unstar' : 'Star'}
          >
            <svg
              className="w-3.5 h-3.5"
              fill={file.isStarred ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>

          <Dropdown
            trigger={
              <button
                data-no-nav
                className="icon-btn w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                title="More options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            }
            items={menuItems}
          />
        </div>
      </div>
    </div>
  );
}

function FileTypeIcon({ type, color }: { type: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    pdf: (
      <svg className={cn('w-12 h-12', color)} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 17h2v-2H8v2zm0-4h8v-2H8v2zm4-6H8V5h4v2z" />
      </svg>
    ),
    spreadsheet: (
      <svg className={cn('w-12 h-12', color)} fill="currentColor" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13H6v-2h2v2zm0 4H6v-2h2v2zm4-4h-2v-2h2v2zm0 4h-2v-2h2v2zm4-4h-2v-2h2v2zm0 4h-2v-2h2v2z" />
      </svg>
    ),
    image: (
      <svg className={cn('w-12 h-12', color)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    video: (
      <svg className={cn('w-12 h-12', color)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    archive: (
      <svg className={cn('w-12 h-12', color)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
    file: (
      <svg className={cn('w-12 h-12', color)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };

  return <>{icons[type] ?? icons.file}</>;
}
