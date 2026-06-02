'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LFSUploadJob } from '@/types/lfs';
import { formatBytes } from './FileSizeLabel';

interface Props {
  onFiles: (jobs: LFSUploadJob[]) => void;
  accept?: string;
  maxBytes?: number;
  requiresAuth?: boolean;
  onAuthRequired?: () => void;
  className?: string;
}

export function UploadDropzone({ onFiles, accept, maxBytes = 5 * 1024 * 1024 * 1024, requiresAuth, onAuthRequired, className }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((fileList: FileList) => {
    if (requiresAuth) { onAuthRequired?.(); return; }
    const jobs: LFSUploadJob[] = Array.from(fileList).map((f) => ({
      id: `${f.name}-${Date.now()}`,
      file: f,
      name: f.name,
      sizeBytes: f.size,
      progress: 0,
      status: 'queued' as const,
    }));
    onFiles(jobs);
  }, [onFiles, requiresAuth, onAuthRequired]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-150 cursor-pointer group',
        isDragging ? 'border-brand-red bg-brand-red/5 scale-[1.01]' : 'border-brand-gray hover:border-brand-black hover:bg-brand-white-soft',
        className,
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => requiresAuth ? onAuthRequired?.() : inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files && processFiles(e.target.files)}
        aria-label="Upload files"
      />
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all', isDragging ? 'bg-brand-red text-white' : 'bg-brand-white-soft text-brand-gray-dark group-hover:bg-brand-black group-hover:text-white')}>
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="font-bold text-brand-black mb-1">
        {requiresAuth ? 'Sign in to upload files' : 'Drop files here or click to browse'}
      </p>
      <p className="text-sm text-brand-gray-dark">
        {requiresAuth ? 'Create a free account to start uploading' : `Upload up to ${formatBytes(maxBytes)} per file · Any format`}
      </p>
    </div>
  );
}
