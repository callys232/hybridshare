'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { FileIcon } from '@/component/lfs/FileIcon';
import { GridPattern } from '@/component/ui/BackgroundPattern';
import { FileSizeLabel } from '@/component/lfs/FileSizeLabel';
import { GuestBanner } from '@/component/lfs/GuestBanner';
import { Spinner } from '@/component/ui/Spinner';

interface SearchHit {
  id: string;
  type: 'file' | 'workspace' | 'library' | 'course';
  name: string;
  description?: string;
  extension?: string;
  sizeBytes?: number;
  location?: string;
  updatedAt: string;
  highlight?: string;
}

const MOCK_HITS: SearchHit[] = [
  { id: 'f1', type: 'file', name: 'Q4 Brand Guidelines.pdf', extension: 'pdf', sizeBytes: 4500000, location: 'Acme Business Hub / Brand Assets', updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(), highlight: 'Updated colour palette and <mark>typography</mark> guidelines for Q4 campaigns.' },
  { id: 'f6', type: 'file', name: 'Service Agreement — Acme Corp.docx', extension: 'docx', sizeBytes: 540000, location: 'Acme Business Hub / Contracts', updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), highlight: 'Master <mark>service agreement</mark> governing all deliverables for Acme Corp engagement.' },
  { id: 'w1', type: 'workspace', name: 'Acme Business Hub', description: 'Central workspace for BIZ pillar documents.', location: 'Organisation', updatedAt: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: 'f3', type: 'file', name: 'Investor Pitch Deck.pptx', extension: 'pptx', sizeBytes: 22000000, location: 'Acme Business Hub / Proposals', updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(), highlight: 'Series A <mark>pitch deck</mark> for investor presentation, Q4 2026.' },
];

const TYPE_ICONS: Record<string, string> = { file: '📄', workspace: '🏢', library: '📚', course: '🎓' };

function SearchContent() {
  const { user } = useAuthStore();
  const isGuest = !user;
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(params?.get('q') ?? '');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searched, setSearched] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const q = params?.get('q') ?? '';
    if (q) { setQuery(q); runSearch(q); }
  }, [params]);

  const runSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setSearched(true);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    try {
      const res = await api.get(`/search?q=${encodeURIComponent(q)}&type=${typeFilter}`);
      setResults((res.data as { data: SearchHit[] }).data ?? MOCK_HITS);
    } catch {
      setResults(MOCK_HITS.filter((h) => h.name.toLowerCase().includes(q.toLowerCase()) || h.highlight?.toLowerCase().includes(q.toLowerCase())));
    } finally {
      setIsSearching(false);
    }
  };

  const filtered = typeFilter === 'all' ? results : results.filter((r) => r.type === typeFilter);
  const typeCounts = results.reduce((acc, r) => { acc[r.type] = (acc[r.type] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="relative space-y-0 animate-fade-in -m-6">
      <GridPattern opacity={0.45} />
      {isGuest && <GuestBanner />}
      <div className="relative z-10 p-6 space-y-6">
        {/* Search bar */}
        <div className="max-w-2xl">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray-dark dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch(query)}
              placeholder="Search files, workspaces, libraries…"
              className="w-full pl-12 pr-32 py-3.5 border border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-2 rounded-xl text-sm text-brand-black dark:text-dark-text placeholder:text-brand-gray-dark dark:placeholder:text-dark-text-muted focus:outline-none focus:border-brand-black dark:focus:border-dark-border-soft shadow-input transition-all"
              aria-label="Search"
            />
            <button
              type="button"
              onClick={() => runSearch(query)}
              disabled={!query.trim() || isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary btn-sm"
            >
              {isSearching ? 'Searching…' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-2">
            Tip: use <kbd className="bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border px-1 py-0.5 rounded text-[10px]">AND</kbd>, <kbd className="bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border px-1 py-0.5 rounded text-[10px]">OR</kbd>, <kbd className="bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border px-1 py-0.5 rounded text-[10px]">&quot;exact phrase&quot;</kbd> for advanced queries
          </p>
        </div>

        {isSearching ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : searched && (
          <>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <strong className="text-brand-black dark:text-dark-text">&ldquo;{params?.get('q')}&rdquo;</strong>
              </p>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'file', 'workspace', 'library', 'course'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTypeFilter(t)} className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize', typeFilter === t ? 'bg-brand-black dark:bg-white text-white dark:text-brand-black border-brand-black dark:border-white' : 'bg-white dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted border-brand-gray dark:border-dark-border hover:border-brand-black dark:hover:border-dark-border-soft')}>
                    {t === 'all' ? `All (${results.length})` : `${TYPE_ICONS[t]} ${t} (${typeCounts[t] ?? 0})`}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-semibold text-brand-black dark:text-dark-text">No results found</p>
                <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted mt-1">Try different keywords or remove filters</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden hover:border-brand-black dark:hover:border-dark-border-soft transition-colors">
                {filtered.map((hit, i) => (
                  <div key={hit.id} className={cn('flex items-start gap-4 px-5 py-4 hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors cursor-pointer group', i > 0 && 'border-t border-brand-gray dark:border-dark-border')}>
                    {hit.extension ? (
                      <FileIcon extension={hit.extension} size="md" className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border flex items-center justify-center text-lg flex-shrink-0">{TYPE_ICONS[hit.type]}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-sm text-brand-black dark:text-dark-text group-hover:text-brand-red transition-colors truncate">{hit.name}</p>
                        <span className="text-[10px] bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border text-brand-gray-dark dark:text-dark-text-muted px-1.5 py-0.5 rounded-full capitalize flex-shrink-0">{hit.type}</span>
                      </div>
                      {hit.location && <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mb-1">{hit.location}</p>}
                      {hit.highlight && (
                        <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted line-clamp-2 [&_mark]:bg-amber-200 dark:[&_mark]:bg-amber-900 [&_mark]:rounded [&_mark]:px-0.5 [&_mark]:text-brand-black dark:[&_mark]:text-dark-text" dangerouslySetInnerHTML={{ __html: hit.highlight }} />
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {hit.sizeBytes && <FileSizeLabel bytes={hit.sizeBytes} className="text-xs text-brand-gray-dark dark:text-dark-text-muted" />}
                      <span className="text-[10px] text-brand-gray-dark dark:text-dark-text-muted">{new Date(hit.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!searched && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-brand-black dark:text-dark-text mb-2">Search everything</p>
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted max-w-sm mx-auto">Find files, workspaces, libraries, and courses — all from one place. Supports full-text search inside documents.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16"><Spinner size="lg" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
