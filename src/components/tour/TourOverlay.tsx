'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useTourStore, TOUR_TOTAL } from '@/store/tour.store';

// ── Step definitions ──────────────────────────────────────────────────────────
interface TourStep {
  target: string | null; // CSS selector or null (centered card)
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: 'Welcome to Lamid FileShare!',
    description: "Let's take a quick guided tour of the platform. We'll walk through every section of the sidebar and key features so you know exactly where everything lives. Use the arrow keys or buttons to navigate.",
    badge: 'Start',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard',
    description: 'Your home base. See an overview of workspace stats, storage usage, recent files, and quick-access cards to every major section of the platform.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    target: '[data-tour="files"]',
    title: 'Files',
    description: 'Upload, organise, preview, and manage every file type — PDFs, Office docs, images, videos, and more. Drag-and-drop folders, use bulk actions, and browse with the in-browser previewer.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="workspaces"]',
    title: 'Workspaces',
    description: 'Organise files by team or project. Each workspace has its own members, roles, and libraries. Invite colleagues, assign Viewer / Editor / Admin roles, and keep projects neatly separated.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    target: '[data-tour="shared"]',
    title: 'Shared Links',
    description: 'All your public share links in one place. See who viewed each link, how many times it was accessed, and when it expires. Revoke any link instantly. Add passwords and expiry dates for security.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="file-requests"]',
    title: 'File Requests',
    description: "Let anyone upload files directly to your workspace — no account needed. Create a request, set a deadline, and share the upload link. Perfect for collecting documents from external clients.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  },
  {
    target: '[data-tour="connectors"]',
    title: 'Connectors',
    description: 'Link Lamid FileShare to external services: Google Drive, Amazon S3, Dropbox, PostgreSQL, Airtable, Salesforce, and more. Files sync automatically on a schedule you control.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    target: '[data-tour="search"]',
    title: 'Search',
    description: 'Full-text search across all files, workspaces, and libraries instantly. Use AND, OR, and "exact phrase" operators for advanced queries. Filter by file type, date range, or workspace.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="messages"]',
    title: 'Messages',
    description: 'Direct messaging with your teammates. The badge shows unread count in real time. The chat icon in the top bar gives a quick preview — click any thread to read and reply with read receipts.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="tasks"]',
    title: 'Tasks',
    description: 'Create, assign, and track action items alongside your files. Set due dates, link tasks to workspaces, and mark them complete as your team progresses. Tasks also appear on workspace homepages.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    target: '[data-tour="activity"]',
    title: 'Activity',
    description: 'Real-time audit trail of every action on the platform: uploads, downloads, shares, deletions, logins, and connector syncs. Filter by user, date, or event type and export as CSV.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    description: 'All your alerts in one place — file shares, task assignments, new messages, connector syncs, and mentions. The bell icon in the top bar shows the unread count. Customise alert preferences in Settings.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    target: '[data-tour="social"]',
    title: 'Social Feed',
    description: "Your team's activity board. Post updates, share links, celebrate milestones, and attach files. Teammates can react and thread discussions. @mention someone to send them a notification.",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    target: '[data-tour="recycle-bin"]',
    title: 'Recycle Bin',
    description: 'Deleted files are held here for 30 days before automatic removal. Restore any file back to its original location at any time. Permanently delete files to free storage immediately.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  {
    target: '[data-tour="guide"]',
    title: 'Premium User Guide',
    description: 'Your in-depth reference for every feature — step-by-step instructions, pro tips, security comparisons, and API documentation. Searchable and always up to date.',
    badge: 'Premium',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    target: null,
    title: "You're all set!",
    description: "That's the full tour of Lamid FileShare. Start by uploading a file, creating a workspace, or connecting a data source. The Lamid AI assistant (bottom-right) is always available if you need help.",
    badge: 'Done',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

// ── Spotlight & positioning ───────────────────────────────────────────────────
const PAD = 10;
const CARD_W = 308;
const CARD_H_EST = 240;

interface Rect { x: number; y: number; w: number; h: number; }

function getCardPos(rect: Rect): { top: number; left: number } {
  const gap = 20;
  let left = rect.x + rect.w + gap;
  let top  = rect.y + rect.h / 2 - CARD_H_EST / 2;

  if (left + CARD_W > window.innerWidth - 16) {
    left = rect.x - CARD_W - gap;
  }
  if (left < 16) {
    left = rect.x + rect.w / 2 - CARD_W / 2;
    top  = rect.y + rect.h + gap;
  }
  top = Math.max(16, Math.min(top, window.innerHeight - CARD_H_EST - 16));
  return { top, left };
}

// ── Dot‑step indicator ────────────────────────────────────────────────────────
function StepDots({ total, current, onGo }: { total: number; current: number; onGo: (i: number) => void }) {
  const dots = Array.from({ length: total });
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {dots.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onGo(i)}
          aria-label={`Go to step ${i + 1}`}
          className={cn(
            'rounded-full transition-all duration-200',
            i === current
              ? 'w-4 h-1.5 bg-brand-red'
              : i < current
              ? 'w-1.5 h-1.5 bg-brand-red/40'
              : 'w-1.5 h-1.5 bg-brand-gray'
          )}
        />
      ))}
    </div>
  );
}

// ── Tour card ─────────────────────────────────────────────────────────────────
interface CardProps {
  s: TourStep;
  step: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  prev: () => void;
  stop: () => void;
  goTo: (i: number) => void;
}

function TourCard({ s, step, isFirst, isLast, next, prev, stop, goTo }: CardProps) {
  return (
    <div
      className="w-[308px] bg-white dark:bg-dark-surface-1 rounded-2xl shadow-2xl overflow-hidden border border-brand-gray dark:border-dark-border animate-slide-up"
      role="dialog"
      aria-modal="false"
      aria-label={`Tour step: ${s.title}`}
    >
      {/* Red top bar */}
      <div className="h-1 bg-gradient-to-r from-brand-red to-brand-red-dark" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-brand-red/10 border border-brand-red/20 flex items-center justify-center text-brand-red">
            {s.icon}
          </div>
          <div className="flex-1 min-w-0">
            {s.badge && (
              <span className="inline-block text-[9px] font-bold uppercase tracking-widest text-brand-red bg-brand-red/8 border border-brand-red/20 rounded-full px-2 py-0.5 mb-1">
                {s.badge}
              </span>
            )}
            <h3 className="text-sm font-bold text-brand-black dark:text-dark-text leading-snug">{s.title}</h3>
          </div>
          <button
            type="button"
            onClick={stop}
            aria-label="Close tour"
            className="flex-shrink-0 text-brand-gray-dark hover:text-brand-black dark:hover:text-dark-text transition-colors p-0.5 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted leading-relaxed mb-4">
          {s.description}
        </p>

        {/* Dot progress */}
        <div className="mb-4">
          <StepDots total={TOUR_TOTAL} current={step} onGo={goTo} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={stop}
            className="text-[11px] text-brand-gray-dark hover:text-brand-black dark:hover:text-dark-text transition-colors shrink-0"
          >
            {isLast ? '' : 'Skip tour'}
          </button>
          <div className="flex gap-2 ml-auto">
            {!isFirst && (
              <button
                type="button"
                onClick={prev}
                className="px-3 py-1.5 text-xs font-semibold border border-brand-gray dark:border-dark-border text-brand-gray-dark dark:text-dark-text-muted rounded-lg hover:border-brand-gray-dark hover:text-brand-black dark:hover:text-dark-text transition-all"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="px-4 py-1.5 text-xs font-bold bg-brand-red text-white rounded-lg hover:bg-brand-red-dark transition-colors"
            >
              {isLast ? 'Finish' : isFirst ? 'Start tour →' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main overlay ──────────────────────────────────────────────────────────────
export function TourOverlay() {
  const { isActive, step, next, prev, stop, goTo } = useTourStore();
  const [mounted, setMounted] = useState(false);
  const [spotlight, setSpotlight] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const [fade, setFade] = useState(true);

  useEffect(() => { setMounted(true); }, []);

  const currentStep = STEPS[step];

  const updatePosition = useCallback(() => {
    if (!currentStep) return;
    if (!currentStep.target) {
      setSpotlight(null);
      setCardPos(null);
      return;
    }
    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el) {
      setSpotlight(null);
      setCardPos(null);
      return;
    }
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const r = el.getBoundingClientRect();
    const rect = { x: r.x, y: r.y, w: r.width, h: r.height };
    setSpotlight(rect);
    setCardPos(getCardPos(rect));
  }, [currentStep]);

  // Fade transition when step changes
  useEffect(() => {
    if (!isActive) return;
    setFade(false);
    const t = setTimeout(() => {
      updatePosition();
      setFade(true);
    }, 120);
    return () => clearTimeout(t);
  }, [isActive, step, updatePosition]);

  // Recalculate on resize
  useEffect(() => {
    if (!isActive) return;
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [isActive, updatePosition]);

  // Keyboard nav
  useEffect(() => {
    if (!isActive) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      stop();
      if (e.key === 'ArrowRight')  next();
      if (e.key === 'ArrowLeft')   prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, next, prev, stop]);

  if (!mounted || !isActive || !currentStep) return null;

  const isFirst = step === 0;
  const isLast  = step === TOUR_TOTAL - 1;
  const isCentered = !currentStep.target;

  // Spotlight rect with padding applied
  const spr = spotlight ? {
    x: spotlight.x - PAD,
    y: spotlight.y - PAD,
    w: spotlight.w + PAD * 2,
    h: spotlight.h + PAD * 2,
  } : null;

  return createPortal(
    <div
      className={cn('transition-opacity duration-100', fade ? 'opacity-100' : 'opacity-0')}
      style={{ zIndex: 9990 }}
    >
      {/* ── SVG spotlight overlay ─────────────────────────────── */}
      <svg
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ width: '100vw', height: '100vh', zIndex: 9991 }}
      >
        <defs>
          <mask id="lfs-tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spr && (
              <rect
                x={spr.x}
                y={spr.y}
                width={spr.w}
                height={spr.h}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={spr ? 'rgba(0,0,0,0.62)' : 'rgba(0,0,0,0.72)'}
          mask={spr ? 'url(#lfs-tour-mask)' : undefined}
        />
      </svg>

      {/* ── Spotlight border ring ─────────────────────────────── */}
      {spr && (
        <div
          aria-hidden="true"
          className="fixed pointer-events-none rounded-xl ring-2 ring-brand-red ring-offset-0"
          style={{
            zIndex: 9992,
            left: spr.x,
            top:  spr.y,
            width: spr.w,
            height: spr.h,
            boxShadow: '0 0 0 4px rgba(193,33,41,0.25)',
          }}
        />
      )}

      {/* ── Tour card ─────────────────────────────────────────── */}
      {isCentered ? (
        /* Centered welcome / done card */
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ zIndex: 9999 }}
        >
          <TourCard s={currentStep} step={step} isFirst={isFirst} isLast={isLast} next={next} prev={prev} stop={stop} goTo={goTo} />
        </div>
      ) : (
        /* Positioned beside the highlighted element */
        cardPos && (
          <div
            className="fixed"
            style={{ zIndex: 9999, top: cardPos.top, left: cardPos.left }}
          >
            <TourCard s={currentStep} step={step} isFirst={isFirst} isLast={isLast} next={next} prev={prev} stop={stop} goTo={goTo} />
          </div>
        )
      )}

      {/* ── Keyboard hint ─────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white/60 text-[10px] font-medium pointer-events-none"
        style={{ zIndex: 9993 }}
      >
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px]">←</kbd>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px]">→</kbd>
        <span>navigate</span>
        <span className="opacity-40">·</span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[9px]">Esc</kbd>
        <span>close</span>
      </div>
    </div>,
    document.body
  );
}
