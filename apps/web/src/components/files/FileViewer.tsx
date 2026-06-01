'use client';

import { useEffect, useState } from 'react';
import { cn, formatBytes, formatDate } from '@/lib/utils';
import { api, type ApiResponse } from '@/lib/api';
import type { FileMetadata } from '@hybridshare/shared/types/file';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';

interface FileViewerProps {
  file: FileMetadata;
  onClose: () => void;
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = file.mimeType.startsWith('text/');

  const canPreview = isImage || isVideo || isPdf || isText;

  useEffect(() => {
    if (!canPreview) {
      setIsLoading(false);
      return;
    }

    api
      .get<ApiResponse<{ url: string; mimeType: string }>>(`/files/${file.id}/preview`)
      .then((r) => {
        setPreviewUrl(r.data.data?.url ?? null);
      })
      .catch(() => setError('Preview unavailable'))
      .finally(() => setIsLoading(false));
  }, [file.id, canPreview]);

  const handleDownload = async () => {
    try {
      const response = await api.get<ApiResponse<{ url: string }>>(`/files/${file.id}/download`);
      window.open(response.data.data?.url, '_blank');
    } catch {
      setError('Download failed');
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={handleDownload} iconLeft={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }>
            Download
          </Button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Preview pane */}
        <div className="flex-1 min-w-0">
          <div className="bg-brand-white-soft rounded-lg min-h-[300px] max-h-[60vh] flex items-center justify-center overflow-hidden">
            {isLoading ? (
              <Spinner size="lg" className="text-brand-gray-dark" />
            ) : error ? (
              <div className="text-center p-8">
                <svg className="w-12 h-12 text-brand-gray-dark mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-brand-gray-dark">{error}</p>
              </div>
            ) : !canPreview ? (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-brand-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-card">
                  <svg className="w-8 h-8 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-brand-black mb-1">No preview available</p>
                <p className="text-xs text-brand-gray-dark">Download the file to view it.</p>
              </div>
            ) : isImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={file.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : isVideo && previewUrl ? (
              <video controls className="max-w-full max-h-full" src={previewUrl}>
                Your browser does not support video playback.
              </video>
            ) : isPdf && previewUrl ? (
              <iframe
                src={`${previewUrl}#toolbar=0`}
                className="w-full h-[60vh] rounded"
                title={file.name}
              />
            ) : isText && previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-[60vh] rounded font-mono text-sm"
                title={file.name}
              />
            ) : null}
          </div>
        </div>

        {/* Metadata panel */}
        <div className="w-full lg:w-56 flex-shrink-0 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-brand-black break-words">{file.name}</h3>
            {file.description && (
              <p className="text-xs text-brand-gray-dark mt-1">{file.description}</p>
            )}
          </div>

          <div className="space-y-2.5">
            {[
              { label: 'Size', value: formatBytes(file.size) },
              { label: 'Type', value: file.mimeType },
              { label: 'Extension', value: `.${file.extension}` },
              { label: 'Uploaded', value: formatDate(file.createdAt) },
              { label: 'Modified', value: formatDate(file.updatedAt) },
              { label: 'Versions', value: `${file.versionCount}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-semibold text-brand-gray-dark uppercase tracking-wider">{label}</p>
                <p className="text-xs text-brand-black mt-0.5 break-all">{value}</p>
              </div>
            ))}
          </div>

          {file.tags && file.tags.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-brand-gray-dark uppercase tracking-wider mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {(file.tags as Array<{ name: string } | string>).map((tag) => (
                  <Badge key={typeof tag === 'string' ? tag : tag.name} variant="default" size="sm">
                    {typeof tag === 'string' ? tag : tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
