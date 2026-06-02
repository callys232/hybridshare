export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('archive')) return 'archive';
  return 'file';
}

export function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-violet-500';
  if (mimeType.startsWith('video/')) return 'text-blue-500';
  if (mimeType.startsWith('audio/')) return 'text-green-500';
  if (mimeType === 'application/pdf') return 'text-brand-red';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'text-emerald-500';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'text-blue-600';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'text-orange-500';
  if (mimeType.startsWith('text/')) return 'text-gray-500';
  if (mimeType.includes('zip') || mimeType.includes('tar')) return 'text-yellow-500';
  return 'text-gray-400';
}

export function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/') ||
    mimeType.startsWith('text/') ||
    mimeType === 'application/pdf' ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('document')
  );
}

export function storagePercentage(used: number, quota: number): number {
  if (quota === 0) return 0;
  return Math.min(100, Math.round((used / quota) * 100));
}
