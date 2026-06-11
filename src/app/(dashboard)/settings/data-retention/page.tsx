'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RetentionRule {
  id: string;
  name: string;
  action: 'archive' | 'delete';
  triggerDays: number;
  triggerType: 'last_access' | 'created' | 'last_modified';
  scope: 'all' | 'workspace' | 'filetype';
  scopeValue?: string;
  enabled: boolean;
}

const MOCK_RULES: RetentionRule[] = [
  {
    id: '1',
    name: 'Auto-archive inactive files',
    action: 'archive',
    triggerDays: 90,
    triggerType: 'last_access',
    scope: 'all',
    enabled: true,
  },
  {
    id: '2',
    name: 'Delete old client drafts',
    action: 'delete',
    triggerDays: 30,
    triggerType: 'last_modified',
    scope: 'filetype',
    scopeValue: 'docx',
    enabled: false,
  },
  {
    id: '3',
    name: 'Purge expired share links',
    action: 'delete',
    triggerDays: 7,
    triggerType: 'created',
    scope: 'all',
    enabled: true,
  },
];

interface RuleFormState {
  name: string;
  action: 'archive' | 'delete';
  triggerDays: string;
  triggerType: 'last_access' | 'created' | 'last_modified';
  scope: 'all' | 'workspace' | 'filetype';
  scopeValue: string;
}

const INITIAL_FORM: RuleFormState = {
  name: '',
  action: 'archive',
  triggerDays: '90',
  triggerType: 'last_access',
  scope: 'all',
  scopeValue: '',
};

function actionBadge(action: 'archive' | 'delete') {
  return action === 'archive'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-red-50 text-red-700 border-red-200';
}

function triggerLabel(rule: RetentionRule): string {
  const type = rule.triggerType === 'last_access' ? 'last accessed'
    : rule.triggerType === 'created' ? 'created'
    : 'last modified';
  return `${rule.triggerDays} days since ${type}`;
}

function scopeLabel(rule: RetentionRule): string {
  if (rule.scope === 'all') return 'All files';
  if (rule.scope === 'filetype') return `File type: ${rule.scopeValue ?? '—'}`;
  return `Workspace: ${rule.scopeValue ?? '—'}`;
}

export default function DataRetentionPage() {
  const [rules, setRules] = useState<RetentionRule[]>(MOCK_RULES);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<RuleFormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const rule: RetentionRule = {
      id: `${Date.now()}`,
      name: form.name,
      action: form.action,
      triggerDays: parseInt(form.triggerDays) || 90,
      triggerType: form.triggerType,
      scope: form.scope,
      scopeValue: form.scopeValue || undefined,
      enabled: true,
    };
    setRules((prev) => [...prev, rule]);
    setForm(INITIAL_FORM);
    setShowCreate(false);
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-black dark:text-white">Data Retention</h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            Automate how long files are kept before being archived or permanently deleted.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="btn-primary btn-sm flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add rule
        </button>
      </div>

      {/* Info banner */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-blue-800">Rules run nightly at 02:00 UTC</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Archived files are moved to cold storage and can be restored within 30 days. Deleted files are permanently removed and cannot be recovered.
          </p>
        </div>
      </div>

      {/* Rules list */}
      <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden">
        {rules.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-12 h-12 rounded-2xl bg-brand-white-soft flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black">No retention rules</p>
            <p className="text-sm text-brand-gray-dark mt-1">Add a rule to automate file lifecycle management.</p>
          </div>
        ) : (
          rules.map((rule, idx) => (
            <div key={rule.id} className={cn('flex items-center gap-4 px-5 py-4 hover:bg-brand-white-soft transition-colors', idx < rules.length - 1 && 'border-b border-brand-gray')}>
              {/* Toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={rule.enabled}
                onClick={() => toggleRule(rule.id)}
                className={cn(
                  'relative w-9 h-5 rounded-full transition-colors flex-shrink-0',
                  rule.enabled ? 'bg-brand-black' : 'bg-brand-gray'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                  rule.enabled ? 'translate-x-4' : 'translate-x-0.5'
                )} />
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn('text-sm font-semibold', rule.enabled ? 'text-brand-black' : 'text-brand-gray-dark')}>{rule.name}</p>
                  <span className={cn('text-[10px] font-bold border rounded-full px-2 py-0.5 capitalize', actionBadge(rule.action))}>
                    {rule.action}
                  </span>
                </div>
                <p className="text-xs text-brand-gray-dark mt-0.5">
                  {triggerLabel(rule)} · {scopeLabel(rule)}
                </p>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => deleteRule(rule.id)}
                title="Delete rule"
                className="p-1.5 rounded-lg text-brand-gray-dark hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Audit log preview */}
      <div>
        <h2 className="text-sm font-bold text-brand-black dark:text-white mb-3">Recent activity</h2>
        <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden">
          {[
            { action: 'archived', count: 14, rule: 'Auto-archive inactive files', date: '2026-06-10 02:00 UTC' },
            { action: 'deleted', count: 3, rule: 'Purge expired share links', date: '2026-06-10 02:01 UTC' },
            { action: 'archived', count: 8, rule: 'Auto-archive inactive files', date: '2026-06-09 02:00 UTC' },
          ].map((entry, i) => (
            <div key={i} className={cn('flex items-center gap-4 px-5 py-3 text-xs', i < 2 && 'border-b border-brand-gray')}>
              <span className={cn(
                'font-medium px-2 py-0.5 rounded-full border text-[10px]',
                entry.action === 'archived' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'
              )}>
                {entry.action}
              </span>
              <span className="text-brand-black font-medium">{entry.count} files</span>
              <span className="text-brand-gray-dark flex-1 truncate">via &ldquo;{entry.rule}&rdquo;</span>
              <span className="text-brand-gray-dark flex-shrink-0">{entry.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create rule modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-brand-gray animate-fade-in">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-brand-gray">
              <h2 className="text-base font-bold text-brand-black">Add Retention Rule</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="icon-btn">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="rule-name">
                  Rule name <span className="text-red-500">*</span>
                </label>
                <input
                  id="rule-name"
                  type="text"
                  required
                  placeholder="e.g. Archive old client files"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="rule-action">Action</label>
                  <select
                    id="rule-action"
                    value={form.action}
                    onChange={(e) => setForm((f) => ({ ...f, action: e.target.value as 'archive' | 'delete' }))}
                    className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors bg-white"
                  >
                    <option value="archive">Archive</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="rule-days">After (days)</label>
                  <input
                    id="rule-days"
                    type="number"
                    min={1}
                    max={3650}
                    value={form.triggerDays}
                    onChange={(e) => setForm((f) => ({ ...f, triggerDays: e.target.value }))}
                    className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="rule-trigger">Trigger based on</label>
                <select
                  id="rule-trigger"
                  value={form.triggerType}
                  onChange={(e) => setForm((f) => ({ ...f, triggerType: e.target.value as RuleFormState['triggerType'] }))}
                  className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors bg-white"
                >
                  <option value="last_access">Last accessed</option>
                  <option value="last_modified">Last modified</option>
                  <option value="created">Date created</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="rule-scope">Apply to</label>
                  <select
                    id="rule-scope"
                    value={form.scope}
                    onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as RuleFormState['scope'], scopeValue: '' }))}
                    className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors bg-white"
                  >
                    <option value="all">All files</option>
                    <option value="filetype">File type</option>
                    <option value="workspace">Workspace</option>
                  </select>
                </div>
                {form.scope !== 'all' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-black mb-1.5" htmlFor="rule-scope-val">
                      {form.scope === 'filetype' ? 'Extension (e.g. pdf)' : 'Workspace name'}
                    </label>
                    <input
                      id="rule-scope-val"
                      type="text"
                      placeholder={form.scope === 'filetype' ? 'pdf' : 'Client Work'}
                      value={form.scopeValue}
                      onChange={(e) => setForm((f) => ({ ...f, scopeValue: e.target.value }))}
                      className="w-full px-3 py-2 border border-brand-gray rounded-lg text-sm focus:outline-none focus:border-brand-black transition-colors"
                    />
                  </div>
                )}
              </div>

              {form.action === 'delete' && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs text-red-700">Deleted files are permanently removed and cannot be recovered.</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-brand-gray text-sm font-medium text-brand-black rounded-xl hover:bg-brand-white-soft transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-brand-black text-white text-sm font-semibold rounded-xl hover:bg-brand-red transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {saving ? 'Saving…' : 'Save rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
