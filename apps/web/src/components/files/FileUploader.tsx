'use client';

import { useState, useRef, useCallback } from 'react';
import { cn, formatBytes } from '@/lib/utils';
import { useFileStore } from '@/store/file.store';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';

interface FileUploaderProps {
  onClose: () => void;
  onSuccess?: () => void;
  workspaceId?: string;
  folderId?: string;
}

interface QueuedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  error?: string;
}

export function FileUploader({ onClose, onSuccess, workspaceId, folderId }: FileUploaderProps) {
  const { uploadFile } = useFileStore();
  const { success, error: errorToast } = useToast();
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const newFiles: QueuedFile[] = Array.from(files).map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'pending',
      progress: 0,
    }));
    setQueue((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    const pending = queue.filter((f) => f.status === 'pending');
    if (!pending.length) return;

    setIsUploading(true);
    let successCount = 0;

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading' } : f))
      );

      try {
        await uploadFile(item.file, {
          ...(workspaceId ? { workspaceId } : {}),
          ...(folderId ? { folderId } : {}),
        });

        setQueue((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100 } : f))
        );
        successCount++;
      } catch (err) {
        const message = (err as Error).message ?? 'Upload failed';
        setQueue((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'error', error: message } : f))
        );
        errorToast(`Failed to upload "${item.file.name}": ${message}`);
      }
    }

    setIsUploading(false);

    if (successCount > 0) {
      success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded successfully`);
      onSuccess?.();
    }
  };

  const pendingCount = queue.filter((f) => f.status === 'pending').length;
  const doneCount = queue.filter((f) => f.status === 'done').length;
  const allDone = queue.length > 0 && queue.every((f) => f.status === 'done' || f.status === 'error');

  return (
    <Modal
      open
      onClose={onClose}
      title="Upload Files"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            {allDone ? 'Close' : 'Cancel'}
          </Button>
          {!allDone && (
            <Button
              variant="primary"
              onClick={uploadAll}
              loading={isUploading}
              disabled={pendingCount === 0}
            >
              Upload {pendingCount > 0 ? `(${pendingCount})` : ''}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-card p-10 text-center cursor-pointer transition-all duration-200',
            isDragging
              ? 'border-brand-red bg-brand-red-muted scale-[1.01]'
              : 'border-brand-gray hover:border-brand-black hover:bg-brand-white-soft'
          )}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          aria-label="Drop files here or click to browse"
        >
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors duration-200',
            isDragging ? 'bg-brand-red text-white' : 'bg-brand-white-soft text-brand-gray-dark'
          )}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-brand-black">
            {isDragging ? 'Drop to upload' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-brand-gray-dark mt-1">
            or <span className="text-brand-red font-medium underline-offset-2 hover:underline">browse files</span>
          </p>
          <p className="text-[10px] text-brand-gray-dark mt-2">
            Max 500 MB per file
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {queue.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {queue.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-colors duration-150',
                  item.status === 'done' && 'bg-emerald-50 border-emerald-200',
                  item.status === 'error' && 'bg-red-50 border-red-200',
                  item.status === 'pending' && 'bg-white border-brand-gray',
                  item.status === 'uploading' && 'bg-blue-50 border-blue-200'
                )}
              >
                <div className="flex-shrink-0">
                  {item.status === 'uploading' && <Spinner size="sm" className="text-blue-500" />}
                  {item.status === 'done' && (
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="w-4 h-4 rounded-full bg-brand-red flex items-center justify-center">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  )}
                  {item.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-brand-gray" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-brand-black truncate">{item.file.name}</p>
                  <p className="text-[10px] text-brand-gray-dark">{formatBytes(item.file.size)}</p>
                  {item.error && (
                    <p className="text-[10px] text-brand-red mt-0.5">{item.error}</p>
                  )}
                </div>

                {item.status === 'pending' && (
                  <button
                    onClick={() => removeFromQueue(item.id)}
                    aria-label="Remove from queue"
                    className="icon-btn w-5 h-5 p-0 flex-shrink-0 text-brand-gray-dark"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {allDone && doneCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700 font-medium">
            âœ“ {doneCount} file{doneCount > 1 ? 's' : ''} uploaded successfully
          </div>
        )}
      </div>
    </Modal>
  );
}
