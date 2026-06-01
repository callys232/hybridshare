'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ContactData {
  website:      string;
  linkedinUrl:  string;
  twitterHandle: string;
}

interface ContactFormProps {
  initialData: Partial<ContactData>;
  onSave: (data: ContactData) => Promise<void>;
  className?: string;
}

function Field({ label, prefix, children }: { label: string; prefix?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">{label}</label>
      {prefix ? (
        <div className="flex items-center">
          <span className="input-field-prefix text-sm text-brand-gray-dark rounded-l-button border border-r-0 border-brand-gray bg-brand-white-soft dark:bg-dark-surface-2 px-3 py-2 flex-shrink-0 select-none">
            {prefix}
          </span>
          <div className="flex-1">{children}</div>
        </div>
      ) : children}
    </div>
  );
}

export function ContactForm({ initialData, onSave, className }: ContactFormProps) {
  const [form, setForm] = useState<ContactData>({
    website:       initialData.website       ?? '',
    linkedinUrl:   initialData.linkedinUrl   ?? '',
    twitterHandle: initialData.twitterHandle ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (k: keyof ContactData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const baseInput = 'w-full input-field text-sm rounded-l-none border-l-0';

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      <Field label="Website">
        <input
          type="url"
          className="w-full input-field text-sm"
          value={form.website}
          onChange={(e) => set('website', e.target.value)}
          placeholder="https://yoursite.com"
          autoComplete="url"
        />
      </Field>

      <Field label="LinkedIn" prefix="linkedin.com/in/">
        <input
          className={baseInput}
          value={form.linkedinUrl}
          onChange={(e) => set('linkedinUrl', e.target.value.replace(/^.*linkedin\.com\/in\//i, ''))}
          placeholder="your-handle"
        />
      </Field>

      <Field label="Twitter / X" prefix="@">
        <input
          className={baseInput}
          value={form.twitterHandle}
          onChange={(e) => set('twitterHandle', e.target.value.replace(/^@/, ''))}
          placeholder="yourhandle"
        />
      </Field>

      {error && <p className="text-xs text-brand-red">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <p className={cn('text-xs font-medium transition-opacity duration-300',
          saved ? 'text-emerald-600 opacity-100' : 'opacity-0')}>
          <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </p>
        <button type="submit" disabled={saving}
          className="btn-primary text-sm px-5 py-2 disabled:opacity-50 flex items-center gap-2">
          {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {saving ? 'Saving…' : 'Save links'}
        </button>
      </div>
    </form>
  );
}
