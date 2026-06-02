'use client';

import Link from 'next/link';
import { cn, formatBytes, formatRelativeTime, getFileIcon, getFileIconColor } from '@/lib/utils';
import type { FileMetadata } from '@/shared/file';
import { Dropdown } from '../ui/Dropdown';
import { Badge } from '../ui/Badge';

interface FileListProps {
  files: (FileMetadata & { uploadedBy?: { id: string; name: string; avatar: string | null } })[];
  selectedFiles: string[];
  onSelect: (id: string, multi: boolean) => void;
  onDelete: (id: string) => void;
  onPreview: (file: FileMetadata) => void;
}

export function FileList({ files, selectedFiles, onSelect, onDelete, onPreview }: FileListProps) {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_100px_100px_120px_auto] items-center gap-4 px-4 py-2.5 border-b border-brand-gray bg-brand-white-soft">
        <div className="w-5" />
        <span className="text-xs font-semibold text-brand-gray-dark">Name</span>
        <span className="text-xs font-semibold text-brand-gray-dark">Size</span>
        <span className="text-xs font-semibold text-brand-gray-dark">Type</span>
        <span className="text-xs font-semibold text-brand-gray-dark">Modified</span>
        <div className="w-8" />
      </div>

      {/* Rows */}
      <div className="divide-y divide-brand-gray/50">
        {files.map((file) => {
          const isSelected = selectedFiles.includes(file.id);
          const iconType = getFileIcon(file.mimeType);
          const iconColor = getFileIconColor(file.mimeType);

          return (
            <div
              key={file.id}
              className={cn(
                'grid grid-cols-[auto_1fr_100px_100px_120px_auto] items-center gap-4 px-4 py-3',
                'table-row-hover group',
                isSelected && 'bg-brand-red-muted/30'
              )}
              onClick={(e) => onSelect(file.id, e.metaKey || e.ctrlKey)}
            >
              {/* Checkbox */}
              <div
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                  'transition-all duration-150 cursor-pointer',
                  isSelected
                    ? 'bg-brand-red border-brand-red'
                    : 'border-brand-gray bg-white group-hover:border-brand-gray-dark'
                )}
                onClick={(e) => { e.stopPropagation(); onSelect(file.id, e.metaKey || e.ctrlKey); }}
              >
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Name */}
              <Link
                href={`/files/${file.id}`}
                className="flex items-center gap-2.5 min-w-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className={cn('flex-shrink-0', iconColor)}>
                  <FileIconSmall type={iconType} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-black truncate group-hover:text-brand-red transition-colors duration-100">
                    {file.name}
                  </p>
                  {file.tags?.length > 0 && (
                    <div className="flex gap-1 mt-0.5">
                      {(file.tags as Array<{ name: string } | string>).slice(0, 2).map((tag) => (
                        <Badge key={typeof tag === 'string' ? tag : tag.name} variant="default" size="sm">
                          {typeof tag === 'string' ? tag : tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>

              {/* Size */}
              <span className="text-xs text-brand-gray-dark">{formatBytes(file.size)}</span>

              {/* Type */}
              <span className="text-xs text-brand-gray-dark truncate">{iconType}</span>

              {/* Modified */}
              <span className="text-xs text-brand-gray-dark">{formatRelativeTime(file.updatedAt)}</span>

              {/* Actions */}
              <Dropdown
                trigger={
                  <button
                    className="icon-btn w-7 h-7 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                    title="More options"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                }
                items={[
                  {
                    id: 'preview',
                    label: 'Preview',
                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                    onClick: () => onPreview(file),
                  },
                  {
                    id: 'delete',
                    label: 'Delete',
                    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
                    onClick: () => onDelete(file.id),
                    danger: true,
                    divider: true,
                  },
                ]}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FileIconSmall({ type }: { type: string }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
