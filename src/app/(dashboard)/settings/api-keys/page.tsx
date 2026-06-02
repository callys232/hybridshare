'use client';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useOrganizationStore } from '@/store/organization.store';

const ALL_SCOPES = [
  { value: 'files:read',        label: 'Files — Read',        description: 'List and download files' },
  { value: 'files:write',       label: 'Files — Write',       description: 'Upload, move and delete files' },
  { value: 'workspaces:read',   label: 'Workspaces — Read',   description: 'List workspaces and members' },
  { value: 'workspaces:write',  label: 'Workspaces — Write',  description: 'Create and manage workspaces' },
  { value: 'shares:read',       label: 'Sharing — Read',      description: 'View share links and analytics' },
  { value: 'shares:write',      label: 'Sharing — Write',     description: 'Create and revoke share links' },
  { value: 'connectors:read',   label: 'Connectors — Read',   description: 'List connectors and sync logs' },
  { value: 'connectors:write',  label: 'Connectors — Write',  description: 'Create and trigger connectors' },
  { value: 'analytics:read',    label: 'Analytics — Read',    description: 'Access storage and usage reports' },
  { value: 'users:read',        label: 'Users — Read',        description: 'Read user profiles and roles' },
  { value: 'webhooks:write',    label: 'Webhooks — Write',    description: 'Manage webhook endpoints' },
];

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function NewKeyModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, scopes: string[], expiresAt?: string) => void }) {
  const [name, setName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['files:read', 'workspaces:read']);
  const [expiresAt, setExpiresAt] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [isCreating, setIsCreating] = useState(false);

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = async () => {
    if (!name.trim() || selectedScopes.length === 0) return;
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setIsCreating(true);
    await new Promise((r) => setTimeout(r, 400));
    onCreate(name, selectedScopes, expiresAt || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-950 border border-brand-gray dark:border-dark-border rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-brand-gray dark:border-dark-border">
          <h2 className="text-base font-bold text-white">Create API Key</h2>
          <button type="button" onClick={onClose} className="text-brand-gray-dark dark:text-dark-text-muted hover:text-white p-1.5 rounded-lg hover:bg-brand-white-soft dark:bg-dark-surface-2 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === 'form' ? (
          <div className="p-5 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">Key Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production Integration"
                className="w-full bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-brand-gray-dark dark:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-2">Scopes</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {ALL_SCOPES.map((scope) => (
                  <label key={scope.value} className="flex items-start gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white dark:bg-dark-surface-1 transition-colors">
                    <div className={cn(
                      'w-4 h-4 rounded border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all',
                      selectedScopes.includes(scope.value) ? 'bg-brand-red border-brand-red' : 'border-brand-gray-mid dark:border-dark-border-soft group-hover:border-brand-gray-dark dark:border-dark-border-soft'
                    )}>
                      {selectedScopes.includes(scope.value) && (
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <input type="checkbox" className="sr-only" checked={selectedScopes.includes(scope.value)} onChange={() => toggleScope(scope.value)} />
                    <div>
                      <p className="text-sm font-medium text-white">{scope.label}</p>
                      <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted">{scope.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wide mb-1.5">
                Expiry <span className="text-brand-gray-dark dark:text-dark-text-muted normal-case font-normal">(optional)</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-brand-white-soft dark:bg-dark-surface-2 text-white text-sm rounded-lg hover:bg-brand-gray dark:bg-dark-surface-3 transition-all font-medium">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim() || selectedScopes.length === 0}
                className="flex-1 py-2.5 bg-brand-red text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold hover:scale-[1.02]"
              >
                Create Key
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-amber-300">
                  <strong>Copy this key now.</strong> For security, we only display the full key once. It cannot be recovered after this dialog closes.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-lg p-3 flex items-center gap-2">
              <code className="flex-1 text-sm text-green-400 font-mono break-all">
                hs_live_{Math.random().toString(36).substring(2, 14)}{Math.random().toString(36).substring(2, 14)}
              </code>
              <button type="button" className="p-2 rounded hover:bg-brand-white-soft dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted hover:text-white transition-all shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isCreating}
              className="w-full py-2.5 bg-brand-red text-white text-sm rounded-lg hover:bg-red-700 transition-all font-semibold"
            >
              {isCreating ? 'Creating...' : 'I have copied the key â€” Done'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const { apiKeys, fetchApiKeys, revokeApiKey } = useOrganizationStore();
  const [showModal, setShowModal] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreate = (name: string, scopes: string[], expiresAt?: string) => {
    setShowModal(false);
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this key? Any integrations using it will immediately stop working.')) return;
    setRevoking(keyId);
    await revokeApiKey(keyId);
    setRevoking(null);
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">API Keys</h1>
          <p className="text-brand-gray-dark dark:text-dark-text-muted text-sm mt-1">Authenticate your integrations with scoped API keys</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-red text-white text-sm rounded-lg hover:bg-red-700 transition-all duration-150 hover:scale-[1.02] font-semibold"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New API Key
        </button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 p-4 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl mb-6">
        <svg className="w-5 h-5 text-brand-gray-dark dark:text-dark-text-muted shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-white">Treat API keys like passwords</p>
          <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5">Never share keys in public repos, logs, or client-side code. Use environment variables or secrets managers.</p>
        </div>
      </div>

      {/* Keys list */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl">
            <svg className="w-12 h-12 text-brand-gray-dark dark:text-dark-text-muted mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <p className="text-brand-gray-dark dark:text-dark-text-muted font-medium">No API keys yet</p>
            <p className="text-brand-gray-dark dark:text-dark-text-muted text-sm mt-1">Create a key to start integrating with the API</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4 hover:border-brand-gray dark:border-dark-border transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-white text-sm">{key.name}</p>
                    {key.expiresAt && new Date(key.expiresAt) < new Date() && (
                      <span className="text-xs bg-red-950/40 text-brand-red border border-brand-red/30 px-1.5 py-0.5 rounded-full">Expired</span>
                    )}
                  </div>
                  <code className="text-xs text-brand-gray-dark dark:text-dark-text-muted font-mono">{key.prefix}â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢</code>
                  <div className="flex items-center gap-3 mt-2 text-xs text-brand-gray-dark dark:text-dark-text-muted">
                    <span>Created {timeAgo(key.createdAt)}</span>
                    {key.lastUsedAt && <span>· Last used {timeAgo(key.lastUsedAt)}</span>}
                    {key.expiresAt && <span>· Expires {new Date(key.expiresAt).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {key.scopes.map((scope) => (
                      <span key={scope} className="text-xs bg-brand-white-soft dark:bg-dark-surface-2 text-brand-gray-dark dark:text-dark-text-muted px-2 py-0.5 rounded-full border border-brand-gray dark:border-dark-border">
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(key.id)}
                  disabled={revoking === key.id}
                  className="px-3 py-1.5 text-xs font-semibold text-brand-red border border-brand-red/30 rounded-lg hover:bg-red-950/30 transition-all duration-150 disabled:opacity-40 shrink-0"
                >
                  {revoking === key.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Docs link */}
      <div className="mt-8 p-4 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">API Reference</p>
          <p className="text-xs text-brand-gray-dark dark:text-dark-text-muted mt-0.5">Full REST API documentation with code examples</p>
        </div>
        <a href="/docs/api" className="px-4 py-2 text-sm text-zinc-300 border border-brand-gray dark:border-dark-border rounded-lg hover:border-brand-gray-dark dark:border-dark-border-soft hover:text-white transition-all duration-150 font-medium">
          View Docs â†’
        </a>
      </div>

      {showModal && <NewKeyModal onClose={() => setShowModal(false)} onCreate={handleCreate} />}
    </div>
  );
}
