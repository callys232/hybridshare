'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useOrganizationStore } from '@/store/organization.store';

const SCOPE_GROUPS = [
  {
    group: 'Files',
    scopes: [
      { value: 'files:read',  label: 'Read',  description: 'List and download files' },
      { value: 'files:write', label: 'Write', description: 'Upload, move and delete files' },
    ],
  },
  {
    group: 'Workspaces',
    scopes: [
      { value: 'workspaces:read',  label: 'Read',  description: 'List workspaces and members' },
      { value: 'workspaces:write', label: 'Write', description: 'Create and manage workspaces' },
    ],
  },
  {
    group: 'Sharing',
    scopes: [
      { value: 'shares:read',  label: 'Read',  description: 'View share links and analytics' },
      { value: 'shares:write', label: 'Write', description: 'Create and revoke share links' },
    ],
  },
  {
    group: 'Analytics',
    scopes: [
      { value: 'analytics:read', label: 'Read', description: 'Access storage and usage reports' },
    ],
  },
  {
    group: 'Users',
    scopes: [
      { value: 'users:read', label: 'Read', description: 'Read user profiles and roles' },
    ],
  },
  {
    group: 'Connectors',
    scopes: [
      { value: 'connectors:read',  label: 'Read',  description: 'List connectors and sync logs' },
      { value: 'connectors:write', label: 'Write', description: 'Create and trigger connectors' },
    ],
  },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

interface CreatedKeyProps {
  rawKey: string;
  onClose: () => void;
}

function CreatedKeyBanner({ rawKey, onClose }: CreatedKeyProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-5 p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl animate-fade-in">
      <div className="flex items-start gap-3 mb-3">
        <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-sm text-amber-300 font-medium">Copy this key now â€” it won't be shown again</p>
      </div>
      <div className="flex items-center gap-2 bg-zinc-950 rounded-lg p-3 border border-zinc-800">
        <code className="flex-1 text-sm text-green-400 font-mono break-all select-all">{rawKey}</code>
        <button type="button" onClick={copy} className="px-3 py-1.5 bg-zinc-800 text-xs font-semibold text-white rounded hover:bg-zinc-700 transition-all shrink-0">
          {copied ? 'âœ“ Copied' : 'Copy'}
        </button>
      </div>
      <button type="button" onClick={onClose} className="mt-3 text-xs text-amber-500 hover:text-amber-300 transition-colors">
        I've saved the key â€” dismiss
      </button>
    </div>
  );
}

export function APIKeyManager() {
  const { apiKeys, fetchApiKeys, createApiKey, revokeApiKey } = useOrganizationStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState(['files:read', 'workspaces:read']);
  const [expiresAt, setExpiresAt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedScopes.length === 0) return;
    setIsCreating(true);
    try {
      const { rawKey } = await createApiKey(name, selectedScopes, expiresAt || undefined);
      setNewRawKey(rawKey ?? null);
      setName('');
      setSelectedScopes(['courses:read', 'enrollments:read']);
      setExpiresAt('');
      setShowForm(false);
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoke this key? This action cannot be undone.')) return;
    setRevokingId(id);
    await revokeApiKey(id).catch(() => {});
    setRevokingId(null);
  };

  return (
    <div>
      {/* New key banner */}
      {newRawKey && <CreatedKeyBanner rawKey={newRawKey} onClose={() => setNewRawKey(null)} />}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-zinc-400">{apiKeys.length} active key{apiKeys.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-2 bg-brand-red text-white text-xs rounded-lg hover:bg-red-700 transition-all hover:scale-[1.02] font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Key
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="mb-5 p-4 bg-zinc-900 border border-zinc-700 rounded-xl space-y-4 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Key Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Zapier Integration"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Scopes</label>
            <div className="space-y-3">
              {SCOPE_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="text-xs text-zinc-500 mb-1.5">{group.group}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.scopes.map((scope) => (
                      <button
                        key={scope.value}
                        type="button"
                        onClick={() => toggleScope(scope.value)}
                        className={cn(
                          'px-2.5 py-1 text-xs rounded-full border font-medium transition-all duration-150',
                          selectedScopes.includes(scope.value)
                            ? 'bg-brand-red/20 text-brand-red border-brand-red/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600 hover:text-white'
                        )}
                      >
                        {scope.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">
              Expires <span className="text-zinc-600 normal-case font-normal">(optional)</span>
            </label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 bg-zinc-800 text-sm text-white rounded-lg hover:bg-zinc-700 transition-all">Cancel</button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!name.trim() || selectedScopes.length === 0 || isCreating}
              className="flex-1 py-2 bg-brand-red text-sm text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {isCreating ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </div>
      )}

      {/* Key list */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-10 text-zinc-600 text-sm">No API keys yet</div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{key.name}</p>
                  <code className="text-xs text-zinc-500 font-mono">{key.prefix}â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢</code>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {key.scopes.map((s) => (
                      <span key={s} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">
                    {key.lastUsedAt ? `Last used ${timeAgo(key.lastUsedAt)}` : 'Never used'}
                    {key.expiresAt && ` Â· Expires ${new Date(key.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                  className="px-2.5 py-1 text-xs font-semibold text-brand-red border border-brand-red/30 rounded-lg hover:bg-red-950/30 transition-all disabled:opacity-40 shrink-0"
                >
                  {revokingId === key.id ? '...' : 'Revoke'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
