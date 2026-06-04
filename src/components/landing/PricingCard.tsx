'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanDef {
  type:         string;
  name:         string;
  tagline:      string;
  monthlyPrice: number | null;
  yearlyPrice:  number | null;
  storage:      string;
  members:      string;
  cta:          string;
  ctaHref:      string;
  highlight:    boolean;
  enterprise:   boolean;
  features:     readonly string[];
  missing:      readonly string[];
  cloud:        { gb: number; price: number };
  accentColor:  string; // hex e.g. '#10B981'
}

interface PricingCardProps {
  plan:    PlanDef;
  billing: 'monthly' | 'yearly';
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ color }: { color: string }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function PricingCard({ plan, billing }: PricingCardProps) {
  const [hovered, setHovered] = useState(false);
  const price = billing === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const { accentColor } = plan;

  // Computed hover styles applied via inline style for dynamic color support
  const cardStyle: React.CSSProperties = {
    borderColor:  hovered ? accentColor : plan.highlight ? accentColor : undefined,
    boxShadow:    hovered
      ? `0 16px 48px -8px ${accentColor}33, 0 4px 16px -4px ${accentColor}22`
      : plan.highlight
        ? `0 4px 24px -4px ${accentColor}28`
        : undefined,
    backgroundColor: hovered && !plan.enterprise ? `${accentColor}05` : undefined,
    transform:       hovered ? 'translateY(-6px)' : 'translateY(0)',
    transition:      'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  const ctaStyle: React.CSSProperties = hovered
    ? { backgroundColor: accentColor, borderColor: accentColor }
    : plan.highlight
      ? { backgroundColor: accentColor, borderColor: accentColor }
      : {};

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-5 cursor-default select-none',
        plan.enterprise ? 'border-zinc-700 bg-zinc-900 text-white' : 'border-brand-gray bg-white',
        plan.highlight && !hovered && 'scale-[1.02]',
      )}
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Popular badge */}
      {plan.highlight && (
        <div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: accentColor }}
        >
          Most popular
        </div>
      )}

      {/* Accent bar at top */}
      <div
        className="absolute top-0 left-6 right-6 h-0.5 rounded-full opacity-0 transition-opacity duration-200"
        style={{ backgroundColor: accentColor, opacity: hovered ? 1 : plan.highlight ? 0.6 : 0 }}
      />

      {/* Plan name */}
      <p className={cn('text-xs font-bold uppercase tracking-widest mb-1', plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark')}>
        {plan.name}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-1 mb-1">
        {price === null ? (
          <span className={cn('text-3xl font-black', plan.enterprise ? 'text-white' : 'text-brand-black')}>Custom</span>
        ) : price === 0 ? (
          <span className={cn('text-3xl font-black', plan.enterprise ? 'text-white' : 'text-brand-black')}>Free</span>
        ) : (
          <>
            <span className={cn('text-3xl font-black', plan.enterprise ? 'text-white' : 'text-brand-black')}>${price}</span>
            <span className={cn('text-xs', plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark')}>/mo</span>
          </>
        )}
      </div>

      {/* Tagline */}
      <p className={cn('text-xs mb-4 leading-relaxed', plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark')}>
        {plan.tagline}
      </p>

      {/* Storage / members row */}
      <div className={cn('text-xs space-y-1.5 mb-4 py-3 border-t border-b', plan.enterprise ? 'border-zinc-700' : 'border-brand-gray')}>
        <div className="flex justify-between">
          <span className={plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark'}>Storage</span>
          <span className={cn('font-semibold', plan.enterprise ? 'text-white' : 'text-brand-black')}>{plan.storage}</span>
        </div>
        <div className="flex justify-between">
          <span className={plan.enterprise ? 'text-zinc-400' : 'text-brand-gray-dark'}>Members</span>
          <span className={cn('font-semibold', plan.enterprise ? 'text-white' : 'text-brand-black')}>{plan.members}</span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-5 flex-1">
        {plan.features.map((f) => (
          <li key={f} className={cn('flex items-start gap-2 text-xs', plan.enterprise ? 'text-zinc-300' : 'text-brand-black')}>
            <CheckIcon color={accentColor} />{f}
          </li>
        ))}
        {plan.missing.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs text-brand-gray-dark">
            <CrossIcon />{f}
          </li>
        ))}
      </ul>

      {/* Cloud add-on badge */}
      <div
        className={cn('flex items-center gap-1.5 text-[11px] font-medium rounded-lg px-2.5 py-2 mb-3 transition-colors duration-200',
          plan.enterprise ? 'bg-zinc-800' : 'bg-white')}
        style={{ border: `1px solid ${accentColor}40`, color: plan.enterprise ? '#a1a1aa' : accentColor }}
      >
        <CloudIcon />
        +${plan.cloud.price}/mo → {plan.cloud.gb >= 1024 ? `${plan.cloud.gb / 1024} TB` : `${plan.cloud.gb} GB`} cloud
      </div>

      {/* CTA button */}
      <Link
        href={plan.ctaHref}
        className={cn(
          'w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] border',
          plan.enterprise
            ? 'bg-white text-zinc-900 hover:bg-zinc-100 border-white'
            : 'text-white border-transparent',
        )}
        style={plan.enterprise ? {} : ctaStyle.backgroundColor
          ? ctaStyle
          : { backgroundColor: '#111', borderColor: '#111' }}
      >
        {plan.cta}
      </Link>
    </div>
  );
}
