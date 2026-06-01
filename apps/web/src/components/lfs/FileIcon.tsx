import { cn } from '@/lib/utils';
import type { FileMime } from '@/types/lfs';

const CONFIG: Record<FileMime, { bg: string; text: string; label: string }> = {
  pdf:   { bg: 'bg-red-100',    text: 'text-red-600',    label: 'PDF' },
  docx:  { bg: 'bg-blue-100',   text: 'text-blue-600',   label: 'DOC' },
  xlsx:  { bg: 'bg-green-100',  text: 'text-green-600',  label: 'XLS' },
  pptx:  { bg: 'bg-orange-100', text: 'text-orange-600', label: 'PPT' },
  image: { bg: 'bg-purple-100', text: 'text-purple-600', label: 'IMG' },
  video: { bg: 'bg-pink-100',   text: 'text-pink-600',   label: 'VID' },
  audio: { bg: 'bg-amber-100',  text: 'text-amber-600',  label: 'AUD' },
  zip:   { bg: 'bg-zinc-100',   text: 'text-zinc-600',   label: 'ZIP' },
  csv:   { bg: 'bg-teal-100',   text: 'text-teal-600',   label: 'CSV' },
  txt:   { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'TXT' },
  other: { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'FILE' },
};

function getFileType(ext: string): FileMime {
  const e = ext.toLowerCase().replace('.', '');
  if (['pdf'].includes(e)) return 'pdf';
  if (['doc', 'docx'].includes(e)) return 'docx';
  if (['xls', 'xlsx'].includes(e)) return 'xlsx';
  if (['ppt', 'pptx'].includes(e)) return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(e)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(e)) return 'video';
  if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(e)) return 'audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(e)) return 'zip';
  if (['csv'].includes(e)) return 'csv';
  if (['txt', 'md', 'json', 'xml', 'yml', 'yaml'].includes(e)) return 'txt';
  return 'other';
}

interface Props {
  extension: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-sm',
};

export function FileIcon({ extension, size = 'md', className }: Props) {
  const type = getFileType(extension);
  const { bg, text, label } = CONFIG[type];
  return (
    <div className={cn('rounded-lg flex items-center justify-center font-bold flex-shrink-0', bg, text, SIZES[size], className)}>
      {label}
    </div>
  );
}

export { getFileType };
