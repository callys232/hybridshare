'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: '#features',  label: 'Features' },
  { href: '#how',       label: 'How it works' },
  { href: '#pricing',   label: 'Pricing' },
  { href: '/privacy',   label: 'Privacy' },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-brand-gray dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 select-none group">
          <div className="w-8 h-8 rounded-lg bg-brand-black dark:bg-white flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-110">
            <div className="w-3 h-3 bg-brand-red rounded-sm" />
          </div>
          <span className="text-lg font-black text-brand-black dark:text-white tracking-tight">HybridShare</span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-gray-dark hover:text-brand-black dark:hover:text-white transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-brand-black dark:text-white rounded-lg hover:bg-brand-white-soft dark:hover:bg-zinc-800 transition-colors duration-150"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-bold bg-brand-red text-white rounded-lg hover:bg-red-700 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg text-brand-black dark:text-white hover:bg-brand-white-soft dark:hover:bg-zinc-800 transition-colors duration-150"
        >
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-brand-gray dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-1 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 px-3 text-sm font-medium text-brand-gray-dark dark:text-zinc-400 hover:text-brand-black dark:hover:text-white hover:bg-brand-white-soft dark:hover:bg-zinc-800 rounded-lg transition-colors duration-150"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-brand-gray dark:border-zinc-800 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold border border-brand-gray dark:border-zinc-700 text-brand-black dark:text-white rounded-xl hover:bg-brand-white-soft dark:hover:bg-zinc-800 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="w-full text-center py-2.5 text-sm font-bold bg-brand-red text-white rounded-xl hover:bg-red-700 transition-all"
            >
              Get started free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
