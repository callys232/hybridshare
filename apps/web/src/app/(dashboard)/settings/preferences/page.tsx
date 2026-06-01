'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Tabs } from '@/components/ui/Tabs';
import { Tooltip } from '@/components/ui/Tooltip';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// SVG icons for theme options — no emojis
const ThemeIconLight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
  </svg>
);
const ThemeIconDark = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const ThemeIconSystem = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

type Theme = 'light' | 'dark' | 'system';

const THEME_OPTIONS: Array<{ id: Theme; label: string; Icon: React.FC }> = [
  { id: 'light',  label: 'Light',  Icon: ThemeIconLight  },
  { id: 'dark',   label: 'Dark',   Icon: ThemeIconDark   },
  { id: 'system', label: 'System', Icon: ThemeIconSystem },
];

const DENSITY_OPTIONS = [
  { id: 'comfortable', label: 'Comfortable', description: 'More space between items' },
  { id: 'compact', label: 'Compact', description: 'Denser, more content visible' },
] as const;
type Density = typeof DENSITY_OPTIONS[number]['id'];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '05/29/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '29/05/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-05-29' },
  { value: 'MMM D, YYYY', label: 'MMM D, YYYY', example: 'May 29, 2026' },
];

const FILE_VIEW_TABS = [
  { id: 'grid' as const, label: 'Grid' },
  { id: 'list' as const, label: 'List' },
];

function PreferencesContent() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const [theme, setTheme] = useState<Theme>('system');
  const [density, setDensity] = useState<Density>('comfortable');
  const [dateFormat, setDateFormat] = useState('MMM D, YYYY');
  const [fileView, setFileView] = useState<'grid' | 'list'>('grid');
  const [autoPlayPreviews, setAutoPlayPreviews] = useState(true);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [confirmDeletes, setConfirmDeletes] = useState(true);
  const [openInNewTab, setOpenInNewTab] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/me/preferences', {
        theme, density, dateFormat, fileView,
        autoPlayPreviews, showHiddenFiles, confirmDeletes, openInNewTab,
      });
      toastSuccess('Preferences saved');
    } catch {
      toastError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}
      className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-black/20',
        checked ? 'bg-brand-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700')}>
      <span className={cn('pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-brand-black shadow transition duration-200',
        checked ? 'translate-x-4' : 'translate-x-0')} />
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-black dark:text-white">Preferences</h1>
          <p className="text-sm text-brand-gray-dark mt-1">Customise your HybridShare experience.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>

      {/* Appearance */}
      <div className="card p-5 space-y-5">
        <h2 className="text-sm font-semibold text-brand-black dark:text-white">Appearance</h2>

        <FormField label="Theme">
          <div className="grid grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setTheme(id)}
                className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-150',
                  theme === id
                    ? 'border-brand-black bg-brand-black text-white'
                    : 'border-brand-gray hover:border-brand-gray-dark text-brand-black dark:text-white dark:border-dark-border dark:hover:border-white/40')}>
                <span className="leading-none"><Icon /></span>
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="Density">
          <div className="grid grid-cols-2 gap-3">
            {DENSITY_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" onClick={() => setDensity(opt.id)}
                className={cn('flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all duration-150',
                  density === opt.id
                    ? 'border-brand-black bg-brand-black text-white'
                    : 'border-brand-gray hover:border-brand-gray-dark text-brand-black dark:text-white dark:border-dark-border')}>
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className={cn('text-[11px] mt-0.5', density === opt.id ? 'text-white/70' : 'text-brand-gray-dark')}>
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </FormField>
      </div>

      {/* File browser */}
      <div className="card p-5 space-y-4">
        <h2 className="text-sm font-semibold text-brand-black dark:text-white">File browser</h2>

        <FormField label="Default view">
          <Tabs tabs={FILE_VIEW_TABS} active={fileView} onChange={setFileView} variant="boxed" size="sm" />
        </FormField>

        <FormField label="Date format">
          <div className="grid grid-cols-2 gap-2">
            {DATE_FORMATS.map((fmt) => (
              <button key={fmt.value} type="button" onClick={() => setDateFormat(fmt.value)}
                className={cn('flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all duration-150',
                  dateFormat === fmt.value
                    ? 'border-brand-black bg-brand-black/5 font-semibold text-brand-black dark:text-white'
                    : 'border-brand-gray hover:border-brand-gray-dark text-brand-gray-dark')}>
                <span>{fmt.label}</span>
                <span className="text-[10px] opacity-60">{fmt.example}</span>
              </button>
            ))}
          </div>
        </FormField>

        {([
          { key: 'autoPlayPreviews', label: 'Auto-play video previews', description: 'Play video thumbnails on hover', value: autoPlayPreviews, toggle: () => setAutoPlayPreviews((v) => !v) },
          { key: 'showHiddenFiles', label: 'Show hidden files', description: 'Files beginning with a dot (.)', value: showHiddenFiles, toggle: () => setShowHiddenFiles((v) => !v) },
          { key: 'confirmDeletes', label: 'Confirm before deleting', description: 'Show a confirmation dialog before moving files to trash', value: confirmDeletes, toggle: () => setConfirmDeletes((v) => !v) },
          { key: 'openInNewTab', label: 'Open shared links in new tab', description: 'Preview files in a new browser tab', value: openInNewTab, toggle: () => setOpenInNewTab((v) => !v) },
        ] as const).map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2 border-t border-brand-gray dark:border-dark-border first:border-0">
            <div>
              <p className="text-sm font-medium text-brand-black dark:text-white">{item.label}</p>
              <p className="text-[11px] text-brand-gray-dark mt-0.5">{item.description}</p>
            </div>
            <Tooltip content={item.value ? 'Click to disable' : 'Click to enable'} side="left">
              <Toggle checked={item.value} onChange={item.toggle} label={item.label} />
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <ToastProvider>
      <PreferencesContent />
    </ToastProvider>
  );
}
