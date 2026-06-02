'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface AvatarUploadProps {
  name: string;
  currentAvatar?: string | null;
  onUpload: (file: File) => Promise<void>;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  md: { wrapper: 'w-16 h-16', overlay: 'text-[10px]', icon: 'w-4 h-4' },
  lg: { wrapper: 'w-24 h-24', overlay: 'text-xs',     icon: 'w-5 h-5' },
  xl: { wrapper: 'w-32 h-32', overlay: 'text-xs',     icon: 'w-6 h-6' },
};

export function AvatarUpload({ name, currentAvatar, onUpload, size = 'lg', className }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { wrapper, overlay, icon } = SIZE_MAP[size];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setError(null);
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setError('Upload failed. Please try again.');
      setPreview(null);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(fakeEvent);
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn('relative flex-shrink-0 cursor-pointer group rounded-full', wrapper)}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="Change profile picture"
        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current?.click(); }}
      >
        <Avatar name={name} src={preview ?? currentAvatar} size={size} className="w-full h-full" />

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          uploading && 'opacity-100'
        )}>
          {uploading ? (
            <div className={cn('rounded-full border-2 border-white/30 border-t-white animate-spin', icon)} />
          ) : (
            <>
              <svg className={cn('text-white mb-0.5', icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={cn('text-white font-semibold', overlay)}>Change</span>
            </>
          )}
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="text-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs font-semibold text-brand-red hover:underline disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading…' : 'Upload new photo'}
        </button>
        <p className="text-[10px] text-brand-gray-dark mt-0.5">JPG, PNG, GIF · Max 5 MB</p>
        {error && <p className="text-[10px] text-brand-red mt-1">{error}</p>}
      </div>
    </div>
  );
}
