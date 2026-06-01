'use client';
import { useCallback, useRef } from 'react';
import { api } from '@/lib/api';

/**
 * Business event types with their content URL patterns.
 * Every event carries a contentUrl that links back to the relevant
 * product page so analytics, notifications, and webhooks can deep-link.
 */
export type TrackEventName =
  | 'course_viewed'
  | 'course_enrolled'
  | 'lesson_started'
  | 'lesson_completed'
  | 'quiz_started'
  | 'quiz_submitted'
  | 'quiz_passed'
  | 'quiz_failed'
  | 'certificate_earned'
  | 'certificate_shared'
  | 'badge_earned'
  | 'xp_gained'
  | 'streak_updated'
  | 'leaderboard_viewed'
  | 'learning_path_viewed'
  | 'learning_path_enrolled'
  | 'live_session_viewed'
  | 'live_session_registered'
  | 'forum_thread_viewed'
  | 'forum_post_created'
  | 'announcement_read'
  | 'search_performed'
  | 'profile_updated'
  | 'page_viewed';

interface TrackPayload {
  contentUrl: string;
  [key: string]: unknown;
}

/**
 * Build the contentUrl for each event type given the context.
 */
function buildContentUrl(event: TrackEventName, ctx: Record<string, string | undefined>): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';

  switch (event) {
    case 'course_viewed':
    case 'course_enrolled':
      return `${base}/courses/${ctx.courseSlug ?? ctx.courseId ?? ''}`;
    case 'lesson_started':
    case 'lesson_completed':
      return `${base}/courses/${ctx.courseSlug ?? ctx.courseId ?? ''}/learn?lesson=${ctx.lessonId ?? ''}`;
    case 'quiz_started':
    case 'quiz_submitted':
    case 'quiz_passed':
    case 'quiz_failed':
      return `${base}/courses/${ctx.courseSlug ?? ctx.courseId ?? ''}/learn?lesson=${ctx.lessonId ?? ''}`;
    case 'certificate_earned':
    case 'certificate_shared':
      return `${base}/my-learning?tab=certificates`;
    case 'badge_earned':
    case 'xp_gained':
    case 'streak_updated':
    case 'leaderboard_viewed':
      return `${base}/leaderboard`;
    case 'learning_path_viewed':
    case 'learning_path_enrolled':
      return `${base}/learning-paths/${ctx.pathId ?? ''}`;
    case 'live_session_viewed':
    case 'live_session_registered':
      return `${base}/live-sessions/${ctx.sessionId ?? ''}`;
    case 'forum_thread_viewed':
    case 'forum_post_created':
      return `${base}/community/thread/${ctx.threadId ?? ''}`;
    case 'announcement_read':
      return `${base}/announcements/${ctx.announcementId ?? ''}`;
    case 'search_performed':
      return `${base}/search?q=${encodeURIComponent(ctx.query ?? '')}`;
    case 'profile_updated':
      return `${base}/settings/profile`;
    case 'page_viewed':
    default:
      return typeof window !== 'undefined' ? window.location.href : base;
  }
}

/**
 * useTrack â€” fire-and-forget analytics event tracker.
 *
 * Usage:
 *   const track = useTrack();
 *   track('course_viewed', { courseId: '123', courseSlug: 'react-basics', title: 'React Basics' });
 *
 * All events include a contentUrl pointing to the relevant product page.
 * Events are batched in a queue and flushed every 2 seconds or when the
 * batch reaches 10 events â€” whichever comes first.
 */
export function useTrack() {
  const queue = useRef<Array<{ event: TrackEventName; properties: TrackPayload; timestamp: string }>>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (queue.current.length === 0) return;
    const batch = queue.current.splice(0, queue.current.length);
    try {
      await api.post('/events/batch', { events: batch });
    } catch {
      // Best-effort â€” don't surface tracking failures to the user
    }
  }, []);

  const track = useCallback(
    (
      event: TrackEventName,
      ctx: Record<string, string | undefined> & Record<string, unknown> = {}
    ) => {
      const contentUrl = buildContentUrl(event, ctx as Record<string, string | undefined>);
      const payload: TrackPayload = { ...ctx, contentUrl };

      queue.current.push({
        event,
        properties: payload,
        timestamp: new Date().toISOString(),
      });

      if (queue.current.length >= 10) {
        if (timer.current) clearTimeout(timer.current);
        flush();
        return;
      }

      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 2000);
    },
    [flush]
  );

  return track;
}

/**
 * Standalone fire-and-forget for server components / outside React.
 */
export async function trackEvent(
  event: TrackEventName,
  ctx: Record<string, string | undefined> & Record<string, unknown> = {}
): Promise<void> {
  const contentUrl = buildContentUrl(event, ctx as Record<string, string | undefined>);
  try {
    await api.post('/events', { event, properties: { ...ctx, contentUrl }, timestamp: new Date().toISOString() });
  } catch {
    // Best-effort
  }
}
