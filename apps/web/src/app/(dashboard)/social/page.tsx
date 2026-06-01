'use client';

import { useEffect, useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { api, type ApiResponse } from '@/lib/api';
import { WavesPattern } from '@/components/ui/BackgroundPattern';
import { Button } from '@/components/ui/Button';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { MOCK_SOCIAL_POSTS } from '@/mock/mockfile';

const PLATFORMS = [
  { id: 'TWITTER', label: 'Twitter / X', color: 'bg-sky-500' },
  { id: 'LINKEDIN', label: 'LinkedIn', color: 'bg-blue-700' },
  { id: 'FACEBOOK', label: 'Facebook', color: 'bg-blue-600' },
  { id: 'INSTAGRAM', label: 'Instagram', color: 'bg-pink-600' },
  { id: 'SLACK', label: 'Slack', color: 'bg-green-600' },
  { id: 'TEAMS', label: 'Teams', color: 'bg-violet-600' },
];

export default function SocialPage() {
  const [posts, setPosts] = useState<typeof MOCK_SOCIAL_POSTS>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  const [message, setMessage] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    api.get<ApiResponse<typeof MOCK_SOCIAL_POSTS>>('/social/posts')
      .then((r) => setPosts(r.data.data ?? []))
      .catch(() => setPosts(MOCK_SOCIAL_POSTS))
      .finally(() => setIsLoading(false));
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handlePublish = async () => {
    if (!message.trim() || selectedPlatforms.length === 0) return;
    setIsPublishing(true);
    try {
      await api.post('/social/share', { message, platforms: selectedPlatforms, fileIds: [], assetIds: [], mediaUrls: [], scheduledAt: scheduledAt || null });
      success(scheduledAt ? 'Post scheduled' : 'Post published');
      setShowComposer(false);
      setMessage('');
      setSelectedPlatforms([]);
      setScheduledAt('');
    } catch {
      error('Failed to publish post');
    } finally {
      setIsPublishing(false);
    }
  };

  const charLimit = 280;
  const remaining = charLimit - message.length;

  return (
    <div className="relative space-y-6 animate-fade-in">
      <WavesPattern opacity={0.4} />
      <div className="relative z-10 page-header">
        <div>
          <h1 className="page-title">Social</h1>
          <p className="text-sm text-brand-gray-dark mt-1">Publish files to social platforms via Zernio</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowComposer(true)} iconLeft={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
          New Post
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" className="text-brand-gray-dark" /></div>
      ) : posts.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-sm font-semibold text-brand-black mb-1">No posts yet</p>
          <p className="text-xs text-brand-gray-dark mb-5">Create your first social post to get started.</p>
          <Button variant="primary" size="sm" onClick={() => setShowComposer(true)}>Create Post</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card card-hover p-5 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-brand-black leading-relaxed">{post.message}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {post.platforms.map((p) => {
                    const meta = PLATFORMS.find((pl) => pl.id === p);
                    return (
                      <span key={p} className={cn('px-2 py-0.5 rounded-badge text-[10px] font-bold text-white', meta?.color ?? 'bg-brand-gray-dark')}>
                        {meta?.label ?? p}
                      </span>
                    );
                  })}
                  <StatusBadge status={post.status} />
                  {post.scheduledAt && (
                    <span className="text-[10px] text-brand-gray-dark">Scheduled: {formatRelativeTime(post.scheduledAt)}</span>
                  )}
                  {post.publishedAt && (
                    <span className="text-[10px] text-brand-gray-dark">{formatRelativeTime(post.publishedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showComposer}
        onClose={() => setShowComposer(false)}
        title="Compose post"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowComposer(false)}>Cancel</Button>
            <Button
              variant={scheduledAt ? 'outline' : 'primary'}
              onClick={handlePublish}
              loading={isPublishing}
              disabled={!message.trim() || selectedPlatforms.length === 0}
            >
              {scheduledAt ? 'Schedule' : 'Publish now'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="What do you want to share?"
              maxLength={charLimit}
              autoFocus
            />
            <p className={cn('text-[10px] mt-1 text-right', remaining < 20 ? 'text-brand-red' : 'text-brand-gray-dark')}>
              {remaining} characters remaining
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-brand-black mb-2">Platforms *</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150',
                    selectedPlatforms.includes(platform.id)
                      ? 'border-brand-black bg-brand-black text-white'
                      : 'border-brand-gray hover:border-brand-gray-dark text-brand-black'
                  )}
                >
                  <div className={cn('w-2 h-2 rounded-full', platform.color)} />
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-brand-black mb-1.5">
              Schedule for later (optional)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input-field"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
