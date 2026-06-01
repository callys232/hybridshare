'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface FeatureDetail {
  title: string;
  badge: string;
  tagline: string;
  /** Short summary shown on the feature card */
  desc: string;
  /** Full description shown in the modal */
  description: string;
  benefits: Array<{ title: string; desc: string; icon: string }>;
  /** YouTube video ID — null renders a "coming soon" placeholder */
  videoId: string | null;
  videoTitle: string;
  color: string;
  icon: React.ReactNode;
}

interface FeatureModalProps {
  feature: FeatureDetail | null;
  onClose: () => void;
}

function BenefitIcon({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
    </svg>
  );
}

function VideoArea({ videoId, videoTitle }: { videoId: string | null; videoTitle: string }) {
  if (videoId) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900">
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&color=red`}
          title={videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Placeholder state
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 flex items-center justify-center group cursor-pointer">
      {/* Animated background grid */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice">
        {Array.from({ length: 8 }, (_, col) =>
          Array.from({ length: 5 }, (_, row) => (
            <circle key={`${col}-${row}`} cx={(col + 0.5) * 50} cy={(row + 0.5) * 45} r="1" fill="white" />
          ))
        )}
        <line x1="0" y1="112" x2="400" y2="112" stroke="white" strokeWidth="0.5" strokeDasharray="4 8" />
      </svg>

      {/* Play button */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-brand-red/20 border-2 border-brand-red/40 flex items-center justify-center group-hover:bg-brand-red/30 group-hover:scale-110 transition-all duration-200">
          <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-sm">{videoTitle}</p>
          <p className="text-zinc-500 text-xs mt-0.5">Demo video coming soon</p>
        </div>
      </div>

      {/* Corner badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-zinc-800/90 border border-zinc-700 rounded-full px-2.5 py-1">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
        <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">Live Demo</span>
      </div>
    </div>
  );
}

export function FeatureModal({ feature, onClose }: FeatureModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!feature) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [feature, onClose]);

  if (!feature) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto
        [animation:slide-up_0.2s_ease-out]">

        {/* Close button */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-xl text-brand-gray-dark hover:text-brand-black hover:bg-brand-gray transition-all duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-brand-gray">
          <div className="flex items-center gap-3 pr-8">
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0', feature.color)}>
              {feature.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border', feature.color)}>
                  {feature.badge}
                </span>
              </div>
              <h2 className="text-xl font-black text-brand-black">{feature.title}</h2>
              <p className="text-sm text-brand-gray-dark mt-0.5">{feature.tagline}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Video */}
          <VideoArea videoId={feature.videoId} videoTitle={`${feature.title} — Demo`} />

          {/* Description */}
          <p className="text-sm text-brand-gray-dark leading-relaxed">{feature.description}</p>

          {/* Benefits */}
          <div>
            <h3 className="text-xs font-bold text-brand-black uppercase tracking-widest mb-3">
              How it improves your workflow
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {feature.benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3 p-3 rounded-xl bg-brand-white-soft border border-brand-gray">
                  <div className="w-8 h-8 rounded-lg bg-white border border-brand-gray flex items-center justify-center flex-shrink-0 text-brand-black">
                    <BenefitIcon path={b.icon} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-black">{b.title}</p>
                    <p className="text-[11px] text-brand-gray-dark mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-brand-gray-dark">
            Available on <span className="font-semibold text-brand-black">Starter</span> plan and above.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-brand-gray-dark hover:text-brand-black border border-brand-gray hover:border-brand-black rounded-xl transition-all duration-150"
            >
              Close
            </button>
            <Link
              href="/register"
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold bg-brand-red text-white rounded-xl hover:bg-red-700 transition-all duration-150 active:scale-95 shadow-sm"
            >
              Start for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
