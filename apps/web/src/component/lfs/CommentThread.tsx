'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Avatar } from '@/component/ui/Avatar';
import Link from 'next/link';
import type { LFSComment } from '@/types/lfs';

interface Props {
  fileId: string;
  initialComments?: LFSComment[];
}

const MOCK_COMMENTS: LFSComment[] = [
  {
    id: 'c1', fileId: 'f1', content: 'The typography section on page 4 needs updating to match our new brand guidelines.', isResolved: false,
    author: { id: 'u1', name: 'Amara Okonkwo', email: 'a@example.com', role: 'admin' },
    reactions: { '👍': 2, '❤️': 1 }, createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    replies: [
      { id: 'c1r1', fileId: 'f1', parentId: 'c1', content: 'Agreed, I\'ll update it before EOD.', isResolved: false, author: { id: 'u2', name: 'Chidi Eze', email: 'c@example.com', role: 'member' }, reactions: {}, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    ],
  },
  {
    id: 'c2', fileId: 'f1', content: 'Can we add a dark mode version of the logo to this document?', isResolved: true,
    author: { id: 'u3', name: 'Ngozi Adaora', email: 'n@example.com', role: 'member' },
    reactions: { '👍': 3 }, createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'];

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

export function CommentThread({ fileId, initialComments = MOCK_COMMENTS }: Props) {
  const { user } = useAuthStore();
  const isGuest = !user;
  const [comments, setComments] = useState<LFSComment[]>(initialComments);
  const [newText, setNewText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const addComment = () => {
    if (!newText.trim() || isGuest) return;
    const c: LFSComment = {
      id: `c-${Date.now()}`, fileId, content: newText, isResolved: false,
      author: { id: user!.id, name: user!.name, email: user!.email, role: 'member' },
      reactions: {}, createdAt: new Date().toISOString(),
    };
    setComments((prev) => [c, ...prev]);
    setNewText('');
  };

  const addReply = (parentId: string) => {
    if (!replyText.trim() || isGuest) return;
    const reply: LFSComment = {
      id: `r-${Date.now()}`, fileId, parentId, content: replyText, isResolved: false,
      author: { id: user!.id, name: user!.name, email: user!.email, role: 'member' },
      reactions: {}, createdAt: new Date().toISOString(),
    };
    setComments((prev) => prev.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c));
    setReplyText(''); setReplyingTo(null);
  };

  const react = (commentId: string, emoji: string) => {
    setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, reactions: { ...c.reactions, [emoji]: (c.reactions[emoji] ?? 0) + 1 } } : c));
  };

  const toggleResolve = (id: string) => {
    setComments((prev) => prev.map((c) => c.id === id ? { ...c, isResolved: !c.isResolved } : c));
  };

  const unresolved = comments.filter((c) => !c.isResolved).length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-surface-1">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-brand-gray dark:border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-brand-black dark:text-dark-text text-sm">Comments</h3>
          {unresolved > 0 && (
            <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded-full">{unresolved} open</span>
          )}
        </div>
      </div>

      {/* Comment input */}
      <div className="px-4 py-3 border-b border-brand-gray dark:border-dark-border flex-shrink-0">
        {isGuest ? (
          <div className="text-center py-2">
            <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mb-2">
              <Link href="/login" className="text-brand-red font-semibold hover:underline">Sign in</Link> to leave a comment
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <Avatar name={user?.name ?? 'U'} size="sm" className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Add a comment…"
                rows={2}
                className="input-field resize-none text-xs mb-2"
                aria-label="New comment"
                onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) addComment(); }}
              />
              <div className="flex justify-end">
                <button type="button" onClick={addComment} disabled={!newText.trim()} className="btn-primary btn-sm text-xs">
                  Comment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto divide-y divide-brand-gray dark:divide-dark-border">
        {comments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted">No comments yet</p>
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className={cn('p-4 group', c.isResolved && 'opacity-60')}>
              <div className="flex items-start gap-2.5 mb-2">
                <Avatar name={c.author.name} size="sm" className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-brand-black dark:text-dark-text">{c.author.name}</span>
                    <span className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">{timeAgo(c.createdAt)}</span>
                    {c.isResolved && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">Resolved</span>}
                  </div>
                  <p className="text-xs text-brand-black dark:text-dark-text leading-relaxed">{c.content}</p>
                </div>
              </div>

              {/* Reactions */}
              {Object.keys(c.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 ml-8 mb-2">
                  {Object.entries(c.reactions).map(([emoji, count]) => (
                    <button key={emoji} type="button" onClick={() => react(c.id, emoji)} className="flex items-center gap-0.5 bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border rounded-full px-1.5 py-0.5 text-[10px] hover:border-brand-black dark:hover:border-dark-border-soft transition-colors">
                      {emoji} <span className="text-brand-gray-dark dark:text-dark-text-muted">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Actions */}
              {!isGuest && (
                <div className="flex items-center gap-3 ml-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    {REACTIONS.map((r) => (
                      <button key={r} type="button" aria-label={`React with ${r}`} onClick={() => react(c.id, r)} className="text-sm hover:scale-110 transition-transform">{r}</button>
                    ))}
                  </div>
                  <button type="button" onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)} className="text-[10px] font-semibold text-brand-gray-dark dark:text-dark-text-muted hover:text-brand-black dark:hover:text-dark-text">Reply</button>
                  <button type="button" onClick={() => toggleResolve(c.id)} className="text-[10px] font-semibold text-brand-gray-dark dark:text-dark-text-muted hover:text-emerald-600">{c.isResolved ? 'Reopen' : 'Resolve'}</button>
                </div>
              )}

              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="ml-8 mt-3 space-y-2.5 border-l-2 border-brand-gray dark:border-dark-border pl-3">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex items-start gap-2">
                      <Avatar name={r.author.name} size="xs" className="flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-baseline gap-1.5 mb-0.5">
                          <span className="text-[11px] font-semibold text-brand-black dark:text-dark-text">{r.author.name}</span>
                          <span className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">{timeAgo(r.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-brand-black dark:text-dark-text">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === c.id && !isGuest && (
                <div className="ml-8 mt-2 flex gap-2">
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply…" rows={2} className="input-field resize-none text-xs flex-1" aria-label="Reply text" />
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => addReply(c.id)} disabled={!replyText.trim()} className="btn-primary btn-sm text-xs">Send</button>
                    <button type="button" onClick={() => setReplyingTo(null)} className="btn-ghost btn-sm text-xs">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
