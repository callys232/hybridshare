'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ProfileInfoData {
  name: string;
  jobTitle: string;
  bio: string;
  timezone: string;
  language: string;
}

interface ProfileInfoFormProps {
  initialData: Partial<ProfileInfoData>;
  onSave: (data: ProfileInfoData) => Promise<void>;
  className?: string;
}

const TIMEZONES = [
  'UTC', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' },
  { code: 'zh', label: '中文' },
];

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-[10px] text-brand-gray-dark mt-1">{hint}</p>}
      {error && <p className="text-[10px] text-brand-red mt-1">{error}</p>}
    </div>
  );
}

const inputCls = 'w-full input-field text-sm';
const selectCls = 'w-full input-field text-sm bg-white dark:bg-dark-surface-2';

export function ProfileInfoForm({ initialData, onSave, className }: ProfileInfoFormProps) {
  const [form, setForm] = useState<ProfileInfoData>({
    name:      initialData.name      ?? '',
    jobTitle:  initialData.jobTitle  ?? '',
    bio:       initialData.bio       ?? '',
    timezone:  initialData.timezone  ?? 'UTC',
    language:  initialData.language  ?? 'en',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileInfoData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: keyof ProfileInfoData, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
    setSaved(false);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (form.name.length > 80) e.name = 'Name must be under 80 characters';
    if (form.bio.length > 500) e.bio = 'Bio must be under 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setErrors({ name: 'Save failed. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-5', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full name" error={errors.name}>
          <input className={cn(inputCls, errors.name && 'border-brand-red')}
            value={form.name} onChange={(e) => set('name', e.target.value)}
            placeholder="Jane Smith" maxLength={80} autoComplete="name" />
        </Field>
        <Field label="Job title" hint="Visible to workspace members">
          <input className={inputCls}
            value={form.jobTitle} onChange={(e) => set('jobTitle', e.target.value)}
            placeholder="Senior Engineer" maxLength={100} />
        </Field>
      </div>

      <Field label="Bio" hint={`${form.bio.length}/500 characters`} error={errors.bio}>
        <textarea className={cn(inputCls, 'resize-none', errors.bio && 'border-brand-red')}
          rows={3} value={form.bio} onChange={(e) => set('bio', e.target.value)}
          placeholder="Tell your team a little about yourself…" maxLength={500} />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Timezone">
          <select className={selectCls} value={form.timezone} onChange={(e) => set('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </Field>
        <Field label="Language">
          <select className={selectCls} value={form.language} onChange={(e) => set('language', e.target.value)}>
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className={cn('text-xs transition-opacity duration-300 font-medium',
          saved ? 'text-emerald-600 opacity-100' : 'opacity-0')}>
          <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Changes saved
        </p>
        <button type="submit" disabled={saving}
          className="btn-primary text-sm px-5 py-2 disabled:opacity-50 flex items-center gap-2">
          {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
