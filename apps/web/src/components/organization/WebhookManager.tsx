'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useOrganizationStore } from '@/store/organization.store';

const EVENTS = [
  { value: 'file.uploaded',         label: 'File uploaded',           category: 'Files'      },
  { value: 'file.deleted',          label: 'File deleted',            category: 'Files'      },
  { value: 'file.shared',           label: 'Share link created',      category: 'Files'      },
  { value: 'workspace.created',     label: 'Workspace created',       category: 'Workspaces' },
  { value: 'workspace.member_added',label: 'Member added',            category: 'Workspaces' },
  { value: 'connector.synced',      label: 'Connector sync completed',category: 'Connectors' },
  { value: 'connector.error',       label: 'Connector sync failed',   category: 'Connectors' },
  { value: 'user.created',          label: 'User registered',         category: 'Users'      },
  { value: 'user.deactivated',      label: 'User deactivated',        category: 'Users'      },
  { value: 'payment.succeeded',     label: 'Payment succeeded',       category: 'Billing'    },
  { value: 'payment.failed',        label: 'Payment failed',          category: 'Billing'    },
];

const EVENT_CATEGORIES = Array.from(new Set(EVENTS.map((e) => e.category)));

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function WebhookManager() {
  const { webhooks, fetchWebhookDeliveries, webhookDeliveries, createWebhook, updateWebhook, deleteWebhook } = useOrganizationStore();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ url: '', events: [] as string[] });
  const [isCreating, setIsCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const toggleEvent = (event: string) => {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter((e) => e !== event) : [...f.events, event],
    }));
  };

  const handleCreate = async () => {
    if (!form.url || form.events.length === 0) return;
    setIsCreating(true);
    await createWebhook(form).catch(() => {});
    setForm({ url: '', events: [] });
    setShowForm(false);
    setIsCreating(false);
  };

  const handleExpand = async (webhookId: string) => {
    if (expandedId === webhookId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(webhookId);
    if (!webhookDeliveries[webhookId]) {
      await fetchWebhookDeliveries(webhookId);
    }
  };

  const handleTest = async (webhookId: string) => {
    setTestingId(webhookId);
    await new Promise((r) => setTimeout(r, 800));
    setTestingId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">{webhooks.length} endpoint{webhooks.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white text-xs rounded-lg hover:bg-red-700 transition-all hover:scale-[1.02] font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Endpoint
        </button>
      </div>

      {showForm && (
        <div className="mb-5 p-4 bg-zinc-900 border border-zinc-700 rounded-xl space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Endpoint URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://your-server.com/webhooks"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Subscribe to Events</label>
            {EVENT_CATEGORIES.map((cat) => (
              <div key={cat} className="mb-3">
                <p className="text-xs text-zinc-600 mb-1.5">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {EVENTS.filter((e) => e.category === cat).map((evt) => (
                    <button
                      key={evt.value}
                      type="button"
                      onClick={() => toggleEvent(evt.value)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full border font-medium transition-all duration-150',
                        form.events.includes(evt.value)
                          ? 'bg-brand-red/20 text-brand-red border-brand-red/40'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:text-white'
                      )}
                    >
                      {evt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
            <p className="text-xs text-zinc-500">
              All events are signed with <code className="text-zinc-300">X-HybridShare-Signature: sha256=...</code> using HMAC-SHA256.
              Verify the signature on your server before processing.
            </p>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-zinc-800 text-sm text-white rounded-lg hover:bg-zinc-700 transition-all">Cancel</button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!form.url || form.events.length === 0 || isCreating}
              className="flex-1 py-2 bg-brand-red text-sm text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {isCreating ? 'Creating...' : 'Add Webhook'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">No webhooks configured</div>
        ) : (
          webhooks.map((wh) => (
            <div key={wh.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-150">
              {/* Header */}
              <div className="flex items-center gap-3 p-3">
                <div className={cn('w-2 h-2 rounded-full shrink-0', wh.isActive ? 'bg-green-400' : 'bg-zinc-600')} />
                <code className="flex-1 text-xs text-zinc-300 font-mono truncate">{wh.url}</code>
                <div className="flex items-center gap-1.5">
                  {wh.failureCount > 0 && (
                    <span className="text-xs text-amber-400 font-semibold">{wh.failureCount} fail{wh.failureCount !== 1 ? 's' : ''}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleTest(wh.id)}
                    disabled={testingId === wh.id}
                    className="px-2 py-1 text-xs text-zinc-400 border border-zinc-700 rounded hover:border-zinc-600 hover:text-white transition-all disabled:opacity-40"
                  >
                    {testingId === wh.id ? 'Pinging...' : 'Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateWebhook(wh.id, { isActive: !wh.isActive })}
                    className={cn('px-2 py-1 text-xs rounded border transition-all', wh.isActive ? 'text-zinc-400 border-zinc-700 hover:border-zinc-600' : 'text-green-400 border-green-500/30 hover:bg-green-950/30')}
                  >
                    {wh.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpand(wh.id)}
                    className="p-1 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all"
                  >
                    <svg className={cn('w-4 h-4 transition-transform duration-200', expandedId === wh.id && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteWebhook(wh.id)}
                    className="p-1 text-zinc-600 hover:text-brand-red hover:bg-zinc-800 rounded transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Event chips */}
              <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                {wh.events.map((e) => (
                  <span key={e} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">{e}</span>
                ))}
              </div>

              {/* Deliveries */}
              {expandedId === wh.id && (
                <div className="border-t border-zinc-800 bg-zinc-950/50 p-3 animate-fade-in">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Recent Deliveries</p>
                  {(webhookDeliveries[wh.id] ?? []).length === 0 ? (
                    <p className="text-xs text-zinc-600">No deliveries yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {(webhookDeliveries[wh.id] ?? []).slice(0, 8).map((d) => (
                        <div key={d.id} className="flex items-center gap-3 text-xs">
                          <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', d.success ? 'bg-green-400' : 'bg-brand-red')} />
                          <span className="text-zinc-400 w-16">{d.statusCode || 'err'}</span>
                          <span className="text-zinc-500 flex-1 truncate">{d.eventType}</span>
                          <span className="text-zinc-600">{d.durationMs}ms</span>
                          <span className="text-zinc-600">{timeAgo(d.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
