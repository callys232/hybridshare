'use client';

import { cn } from '@/lib/utils';
import { FileIcon } from './FileIcon';
import { formatBytes } from './FileSizeLabel';
import type { LFSUploadJob } from '@/types/lfs';

const STATUS_COLOR: Record<LFSUploadJob['status'], string> = {
  queued: 'text-brand-gray-dark',
  uploading: 'text-blue-600',
  processing: 'text-amber-600',
  done: 'text-emerald-600',
  error: 'text-brand-red',
};

interface Props { jobs: LFSUploadJob[]; onRemove?: (id: string) => void; }

export function UploadQueue({ jobs, onRemove }: Props) {
  if (jobs.length === 0) return null;
  const done = jobs.filter((j) => j.status === 'done').length;

  return (
    <div className="bg-white border border-brand-gray rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-gray">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-black">Uploads</span>
          <span className="text-xs bg-brand-white-soft text-brand-gray-dark px-2 py-0.5 rounded-full font-bold">{done}/{jobs.length}</span>
        </div>
        {done === jobs.length && (
          <span className="text-xs font-bold text-emerald-600">All done!</span>
        )}
      </div>
      <div className="divide-y divide-brand-gray max-h-64 overflow-y-auto">
        {jobs.map((job) => (
          <div key={job.id} className="flex items-center gap-3 px-4 py-2.5">
            <FileIcon extension={job.name.split('.').pop() ?? ''} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-xs font-medium text-brand-black truncate">{job.name}</p>
                <span className={cn('text-[10px] font-bold capitalize flex-shrink-0', STATUS_COLOR[job.status])}>
                  {job.status === 'uploading' ? `${job.progress}%` : job.status}
                </span>
              </div>
              {job.status === 'uploading' && (
                <div className="h-1 bg-brand-gray rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${job.progress}%` }} />
                </div>
              )}
              {job.status !== 'uploading' && (
                <p className="text-[10px] text-brand-gray-dark">{formatBytes(job.sizeBytes)}</p>
              )}
              {job.error && <p className="text-[10px] text-brand-red mt-0.5">{job.error}</p>}
            </div>
            {(job.status === 'done' || job.status === 'error') && onRemove && (
              <button type="button" aria-label="Remove from upload list" onClick={() => onRemove(job.id)} className="icon-btn w-6 h-6 p-0 flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
