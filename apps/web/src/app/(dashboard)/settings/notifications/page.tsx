'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const DELIVERY_TABS = [
  { id: 'in_app' as const, label: 'In-app' },
  { id: 'email' as const, label: 'Email' },
] as const;
type DeliveryTab = typeof DELIVERY_TABS[number]['id'];

const NOTIFICATION_GROUPS = [
  {
    group: 'Files & Storage',
    items: [
      { key: 'file_shared', label: 'File shared with you', description: 'When someone shares a file or folder with you' },
      { key: 'file_commented', label: 'New comment on file', description: 'When someone comments on your file' },
      { key: 'file_version', label: 'New version uploaded', description: 'When a new version is added to a file you own' },
      { key: 'storage_limit', label: 'Storage quota warning', description: 'When your storage reaches 80% and 95%' },
    ],
  },
  {
    group: 'Workspaces',
    items: [
      { key: 'workspace_invite', label: 'Workspace invitation', description: 'When you are invited to a workspace' },
      { key: 'workspace_member_added', label: 'Member joined', description: 'When a new member joins your workspace' },
      { key: 'workspace_permission_changed', label: 'Permissions changed', description: 'When your role or access level is updated' },
    ],
  },
  {
    group: 'Sharing & Access',
    items: [
      { key: 'share_link_viewed', label: 'Shared link opened', description: 'When someone opens a link you shared' },
      { key: 'share_link_downloaded', label: 'File downloaded via link', description: 'When someone downloads through your share link' },
      { key: 'share_link_expiring', label: 'Share link expiring', description: '24 hours before a share link expires' },
    ],
  },
  {
    group: 'Connectors & Sync',
    items: [
      { key: 'connector_error', label: 'Connector sync error', description: 'When a connector fails to sync' },
      { key: 'connector_completed', label: 'Sync completed', description: 'When a scheduled sync finishes' },
    ],
  },
  {
    group: 'Security',
    items: [
      { key: 'new_login', label: 'New sign-in detected', description: 'When your account is accessed from a new device' },
      { key: 'password_changed', label: 'Password changed', description: 'When your password is updated' },
      { key: 'api_key_used', label: 'API key activity', description: 'When an API key makes a request' },
    ],
  },
];

type Prefs = Record<string, { in_app: boolean; email: boolean }>;

function buildDefaults(): Prefs {
  const out: Prefs = {};
  for (const g of NOTIFICATION_GROUPS)
    for (const item of g.items)
      out[item.key] = { in_app: true, email: ['new_login', 'storage_limit', 'workspace_invite'].includes(item.key) };
  return out;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent',
        'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-black/20',
        checked ? 'bg-brand-black dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'
      )}
    >
      <span className={cn(
        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-brand-black shadow transition duration-200',
        checked ? 'translate-x-4' : 'translate-x-0'
      )} />
    </button>
  );
}

function NotificationsContent() {
  const [prefs, setPrefs] = useState<Prefs>(buildDefaults);
  const [tab, setTab] = useState<DeliveryTab>('in_app');
  const [digest, setDigest] = useState<'real_time' | 'daily' | 'weekly'>('daily');
  const [saving, setSaving] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const toggle = (key: string) =>
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [tab]: !p[key][tab] } }));

  const toggleGroup = (group: string, value: boolean) => {
    const items = NOTIFICATION_GROUPS.find((g) => g.group === group)?.items ?? [];
    setPrefs((p) => {
      const next = { ...p };
      for (const item of items) next[item.key] = { ...next[item.key], [tab]: value };
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/me/notification-preferences', { preferences: prefs, emailDigest: digest });
      toastSuccess('Notification preferences saved');
    } catch {
      toastError('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-brand-black dark:text-white">Notifications</h1>
          <p className="text-sm text-brand-gray-dark mt-1">Control how and when HybridShare alerts you.</p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>

      <Tabs tabs={[...DELIVERY_TABS]} active={tab} onChange={setTab} variant="pill" />

      <div className="space-y-4">
        {NOTIFICATION_GROUPS.map((section) => {
          const allOn = section.items.every((i) => prefs[i.key]?.[tab]);
          return (
            <div key={section.group} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-brand-black dark:text-white">{section.group}</h3>
                <button
                  type="button"
                  onClick={() => toggleGroup(section.group, !allOn)}
                  className="text-xs font-medium text-brand-red hover:underline transition-colors duration-150"
                >
                  {allOn ? 'Disable all' : 'Enable all'}
                </button>
              </div>
              <div className="divide-y divide-brand-gray dark:divide-dark-border">
                {section.items.map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-3 group">
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium text-brand-black dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-brand-gray-dark mt-0.5">{item.description}</p>
                    </div>
                    <Toggle
                      checked={prefs[item.key]?.[tab] ?? false}
                      onChange={() => toggle(item.key)}
                      label={`${item.label} ${tab === 'in_app' ? 'in-app' : 'email'} notification`}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {tab === 'email' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-brand-black dark:text-white mb-1">Email digest</h3>
          <p className="text-xs text-brand-gray-dark mb-4">Bundle non-urgent notifications into a single email.</p>
          <div className="grid grid-cols-3 gap-3">
            {(['real_time', 'daily', 'weekly'] as const).map((freq) => (
              <button
                key={freq}
                type="button"
                onClick={() => setDigest(freq)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-150 hover:shadow-sm',
                  digest === freq
                    ? 'border-brand-black bg-brand-black text-white'
                    : 'border-brand-gray hover:border-brand-gray-dark text-brand-black dark:text-white dark:border-dark-border'
                )}
              >
                <span className="text-sm font-semibold capitalize">{freq.replace('_', ' ')}</span>
                <span className={cn('text-[11px]', digest === freq ? 'text-white/70' : 'text-brand-gray-dark')}>
                  {freq === 'real_time' ? 'Instant' : freq === 'daily' ? 'Once/day' : 'Once/week'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ToastProvider>
      <NotificationsContent />
    </ToastProvider>
  );
}
