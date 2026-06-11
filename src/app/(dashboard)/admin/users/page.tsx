'use client';

import { useEffect, useState } from 'react';
import { cn, formatRelativeTime, formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';
import { isMockMode, MOCK_ADMIN_USERS, MOCK_ADMIN_WORKSPACES, MOCK_CONNECTORS } from '@/mocks';
import type { MockAdminUser } from '@/mocks';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmModal } from '@/components/ui/Modal';
import { LinesPattern } from '@/components/ui/BackgroundPattern';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlatformRole  = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'GUEST';
type UserStatus    = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
type WorkspaceRole = 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER' | 'NONE';
type ConnectorPerm = 'NONE' | 'READ' | 'READ_WRITE' | 'FULL';

interface WorkspaceAccess {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
}

interface ConnectorAccess {
  connectorId: string;
  connectorName: string;
  connectorType: string;
  connectorCategory: string;
  permission: ConnectorPerm;
}

type AdminUser = MockAdminUser;

// ── Config ────────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<PlatformRole, { label: string; color: string; bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-red-700',    bg: 'bg-red-50 border-red-200'       },
  ADMIN:       { label: 'Admin',       color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200'   },
  MANAGER:     { label: 'Manager',     color: 'text-violet-700', bg: 'bg-violet-50 border-violet-200' },
  MEMBER:      { label: 'Member',      color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'     },
  VIEWER:      { label: 'Viewer',      color: 'text-zinc-600',   bg: 'bg-zinc-50 border-zinc-200'     },
  GUEST:       { label: 'Guest',       color: 'text-zinc-500',   bg: 'bg-zinc-50 border-zinc-100'     },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; dot: string }> = {
  ACTIVE:    { label: 'Active',    dot: 'bg-emerald-500' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-red-500'     },
  PENDING:   { label: 'Pending',   dot: 'bg-amber-500'   },
};

const WS_ROLES: WorkspaceRole[] = ['NONE', 'VIEWER', 'COMMENTER', 'EDITOR', 'ADMIN', 'OWNER'];

const CONNECTOR_PERM_OPTIONS: { value: ConnectorPerm; label: string; desc: string }[] = [
  { value: 'NONE',       label: 'No access',       desc: 'Cannot view or query this source' },
  { value: 'READ',       label: 'Read only',        desc: 'Can browse and query data' },
  { value: 'READ_WRITE', label: 'Read + Write',     desc: 'Can read and write records' },
  { value: 'FULL',       label: 'Full access',      desc: 'Read, write, delete, and manage settings' },
];

const CONN_PERM_COLOR: Record<ConnectorPerm, string> = {
  NONE:       'bg-red-50 border-red-200 text-red-700',
  READ:       'bg-white border-brand-gray text-brand-black',
  READ_WRITE: 'bg-blue-50 border-blue-200 text-blue-700',
  FULL:       'bg-amber-50 border-amber-200 text-amber-700',
};

const CATEGORY_BADGE: Record<string, string> = {
  CLOUD:    'bg-sky-50 text-sky-700 border-sky-200',
  DATABASE: 'bg-violet-50 text-violet-700 border-violet-200',
  CRM:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  CUSTOM:   'bg-zinc-50 text-zinc-600 border-zinc-200',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function buildDefaultConnectorAccess(): ConnectorAccess[] {
  return MOCK_CONNECTORS.map((c) => ({
    connectorId: c.id,
    connectorName: c.name,
    connectorType: String(c.type),
    connectorCategory: String(c.category),
    permission: 'NONE',
  }));
}

function buildDefaultWorkspaceAccess(): WorkspaceAccess[] {
  return MOCK_ADMIN_WORKSPACES.map((ws) => ({
    workspaceId: ws.id,
    workspaceName: ws.name,
    role: 'VIEWER',
  }));
}

// ── Create / Invite modal ─────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onCreated: (user: AdminUser) => void;
}

function CreateUserModal({ onClose, onCreated }: CreateModalProps) {
  const [tab, setTab] = useState<'invite' | 'create'>('create');

  // Invite tab
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<PlatformRole>('MEMBER');
  const [inviteQuota, setInviteQuota] = useState('10');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  // Create tab
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('MEMBER');
  const [quota, setQuota] = useState('10');
  const [password, setPassword] = useState('');
  const [autoPassword, setAutoPassword] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (autoPassword) setPassword(generatePassword());
  }, [autoPassword]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteSending(true);
    try { await api.post('/admin/users/invite', { email: inviteEmail, role: inviteRole, storageQuota: parseInt(inviteQuota) * 1_073_741_824 }); }
    catch { /* mock */ }
    setInviteSent(true);
    setInviteSending(false);
  };

  const handleCreate = async () => {
    if (!name.trim() || !email.trim()) return;
    setCreating(true);
    try {
      await api.post('/admin/users', { name, email, role, password, storageQuota: parseInt(quota) * 1_073_741_824 });
    } catch { /* mock */ }
    await new Promise((r) => setTimeout(r, 600));
    const newUser: AdminUser = {
      id: `new-${Date.now()}`,
      name, email, role,
      status: 'ACTIVE',
      storageUsed: 0,
      storageQuota: parseInt(quota) * 1_073_741_824,
      createdAt: new Date().toISOString(),
    };
    onCreated(newUser);
    setCreating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface-1 rounded-2xl shadow-2xl w-full max-w-md border border-brand-gray dark:border-dark-border animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-gray dark:border-dark-border">
          <div className="flex rounded-lg border border-brand-gray overflow-hidden text-sm font-semibold">
            <button type="button" onClick={() => setTab('create')}
              className={cn('px-4 py-1.5 transition-colors', tab === 'create' ? 'bg-brand-black text-white' : 'text-brand-gray-dark hover:text-brand-black')}>
              Create user
            </button>
            <button type="button" onClick={() => setTab('invite')}
              className={cn('px-4 py-1.5 transition-colors', tab === 'invite' ? 'bg-brand-black text-white' : 'text-brand-gray-dark hover:text-brand-black')}>
              Invite by email
            </button>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn w-8 h-8 p-0 ml-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Create tab ─────────────────────────────────────────────────────── */}
        {tab === 'create' && (
          <>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Full name *</label>
                  <input type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} autoFocus
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Email address *</label>
                  <input type="email" placeholder="jane@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Platform role</label>
                  <select value={role} aria-label="Platform role" onChange={(e) => setRole(e.target.value as PlatformRole)}
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
                    <option value="MEMBER">Member</option>
                    <option value="VIEWER">Viewer</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Storage quota (GB)</label>
                  <input type="number" min="1" max="5000" value={quota} onChange={(e) => setQuota(e.target.value)} aria-label="Storage quota"
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-brand-black dark:text-white">Password</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={autoPassword} onChange={(e) => setAutoPassword(e.target.checked)}
                      className="w-3.5 h-3.5 accent-brand-red" />
                    <span className="text-xs text-brand-gray-dark">Auto-generate</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setAutoPassword(false); setPassword(e.target.value); }}
                    readOnly={autoPassword}
                    placeholder="Enter password…"
                    className={cn(
                      'w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 pr-10 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors font-mono',
                      autoPassword && 'text-brand-gray-dark cursor-default'
                    )}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-dark hover:text-brand-black transition-colors" aria-label="Toggle password visibility">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword
                        ? <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></>
                        : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                      }
                    </svg>
                  </button>
                </div>
                {autoPassword && (
                  <p className="text-[10px] text-brand-gray-dark mt-1">
                    Password will be shown once after creation. User should change it on first login.
                  </p>
                )}
              </div>

              <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  The account is created immediately and the user can log in right away. Set connector and workspace permissions after creation via the <strong>Permissions</strong> panel.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-brand-gray dark:border-dark-border">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
              <button type="button" onClick={handleCreate} disabled={!name.trim() || !email.trim() || creating}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                {creating && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                Create user
              </button>
            </div>
          </>
        )}

        {/* ── Invite tab ─────────────────────────────────────────────────────── */}
        {tab === 'invite' && (
          inviteSent ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-bold text-brand-black dark:text-white mb-1">Invitation sent!</p>
              <p className="text-sm text-brand-gray-dark mb-5">Invite emailed to <strong>{inviteEmail}</strong></p>
              <button type="button" onClick={onClose} className="btn-primary text-sm">Done</button>
            </div>
          ) : (
            <>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Email address *</label>
                  <input type="email" placeholder="user@company.com" value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)} autoFocus
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Platform role</label>
                  <select aria-label="Invite role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value as PlatformRole)}
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
                    <option value="MEMBER">Member — full file access</option>
                    <option value="VIEWER">Viewer — read only</option>
                    <option value="MANAGER">Manager — can manage workspaces</option>
                    <option value="ADMIN">Admin — full platform access</option>
                    <option value="GUEST">Guest — external collaborator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Storage quota (GB)</label>
                  <input type="number" min="1" max="1000" value={inviteQuota} onChange={(e) => setInviteQuota(e.target.value)}
                    aria-label="Storage quota" placeholder="10"
                    className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 p-5 border-t border-brand-gray dark:border-dark-border">
                <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
                <button type="button" onClick={handleInvite} disabled={!inviteEmail || inviteSending}
                  className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                  {inviteSending && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                  Send invite
                </button>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

// ── Permissions slide-over ────────────────────────────────────────────────────

function PermissionsPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [wsAccesses, setWsAccesses] = useState<WorkspaceAccess[]>(buildDefaultWorkspaceAccess());
  const [connAccesses, setConnAccesses] = useState<ConnectorAccess[]>(buildDefaultConnectorAccess());
  const [quota, setQuota] = useState(Math.round(user.storageQuota / 1_073_741_824).toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [section, setSection] = useState<'workspace' | 'connectors'>('workspace');

  const setWsRole = (wsId: string, role: WorkspaceRole) =>
    setWsAccesses((prev) => prev.map((a) => a.workspaceId === wsId ? { ...a, role } : a));

  const setConnPerm = (connId: string, permission: ConnectorPerm) =>
    setConnAccesses((prev) => prev.map((a) => a.connectorId === connId ? { ...a, permission } : a));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${user.id}/permissions`, {
        workspacePermissions: wsAccesses,
        connectorPermissions: connAccesses,
        storageQuota: parseInt(quota) * 1_073_741_824,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* no-op */ }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white dark:bg-dark-surface-1 h-full shadow-2xl flex flex-col border-l border-brand-gray dark:border-dark-border">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gray dark:border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div>
              <p className="font-bold text-sm text-brand-black dark:text-white">{user.name}</p>
              <p className="text-xs text-brand-gray-dark">{user.email}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close permissions panel" className="icon-btn w-8 h-8 p-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-brand-gray dark:border-dark-border flex-shrink-0">
          {[
            { key: 'workspace',  label: 'Workspaces' },
            { key: 'connectors', label: 'Databases & Connectors' },
          ].map((t) => (
            <button key={t.key} type="button"
              onClick={() => setSection(t.key as typeof section)}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-colors border-b-2',
                section === t.key
                  ? 'border-brand-black dark:border-white text-brand-black dark:text-white'
                  : 'border-transparent text-brand-gray-dark hover:text-brand-black dark:hover:text-white'
              )}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Storage quota (always visible) ─────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold text-brand-black dark:text-white mb-2 uppercase tracking-wider">Storage quota</h3>
            <div className="flex items-center gap-3">
              <input type="number" min="1" max="5000" value={quota} onChange={(e) => setQuota(e.target.value)}
                aria-label="Storage quota in GB" title="Storage quota in GB"
                className="w-24 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
              <span className="text-sm text-brand-gray-dark">GB</span>
              <span className="text-xs text-brand-gray-dark ml-auto">Using {formatBytes(user.storageUsed)}</span>
            </div>
          </div>

          {/* ── Workspace section ──────────────────────────────────────────── */}
          {section === 'workspace' && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-brand-black dark:text-white mb-0.5 uppercase tracking-wider">Workspace access</h3>
                <p className="text-xs text-brand-gray-dark mb-4">&ldquo;None&rdquo; blocks all access to that workspace.</p>
                <div className="space-y-2">
                  {wsAccesses.map((access) => (
                    <div key={access.workspaceId}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-brand-gray dark:border-dark-border bg-brand-gray/20 dark:bg-dark-surface-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-brand-gray dark:bg-dark-surface-1 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-brand-black dark:text-white truncate">{access.workspaceName}</span>
                      </div>
                      <select
                        aria-label={`${access.workspaceName} access role`}
                        value={access.role}
                        onChange={(e) => setWsRole(access.workspaceId, e.target.value as WorkspaceRole)}
                        className={cn(
                          'text-xs font-semibold rounded-lg px-2 py-1.5 border focus:outline-none transition-colors cursor-pointer flex-shrink-0',
                          access.role === 'NONE'
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : access.role === 'OWNER' || access.role === 'ADMIN'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-white border-brand-gray dark:bg-dark-surface-1 dark:border-dark-border dark:text-white'
                        )}
                      >
                        {WS_ROLES.map((r) => (
                          <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-brand-gray-dark mb-2">Quick presets</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Full access', role: 'EDITOR' as WorkspaceRole },
                    { label: 'View only', role: 'VIEWER' as WorkspaceRole },
                    { label: 'Block all', role: 'NONE' as WorkspaceRole },
                  ].map(({ label, role }) => (
                    <button key={label} type="button"
                      onClick={() => setWsAccesses((prev) => prev.map((a) => ({ ...a, role })))}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-gray hover:border-brand-black transition-colors">
                      {label} — all workspaces
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Connectors / Databases section ────────────────────────────── */}
          {section === 'connectors' && (
            <>
              <div>
                <h3 className="text-xs font-semibold text-brand-black dark:text-white mb-0.5 uppercase tracking-wider">Database &amp; connector access</h3>
                <p className="text-xs text-brand-gray-dark mb-4">
                  Control what each user can do with data from connected databases and cloud sources.
                </p>

                <div className="space-y-2">
                  {connAccesses.map((access) => (
                    <div key={access.connectorId}
                      className="flex items-start gap-3 px-3 py-3 rounded-lg border border-brand-gray dark:border-dark-border bg-brand-gray/20 dark:bg-dark-surface-2">
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-brand-black dark:text-white truncate">{access.connectorName}</span>
                          <span className={cn('text-[10px] font-bold border rounded-full px-1.5 py-0.5', CATEGORY_BADGE[access.connectorCategory] ?? 'bg-zinc-50 text-zinc-600 border-zinc-200')}>
                            {access.connectorCategory}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-gray-dark mt-0.5 font-mono">{access.connectorType.replace(/_/g, ' ')}</p>
                      </div>
                      <select
                        aria-label={`${access.connectorName} permission`}
                        value={access.permission}
                        onChange={(e) => setConnPerm(access.connectorId, e.target.value as ConnectorPerm)}
                        className={cn(
                          'text-xs font-semibold rounded-lg px-2 py-1.5 border focus:outline-none transition-colors cursor-pointer flex-shrink-0 mt-0.5',
                          CONN_PERM_COLOR[access.permission]
                        )}
                      >
                        {CONNECTOR_PERM_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Permission level legend */}
              <div>
                <p className="text-xs font-semibold text-brand-gray-dark mb-2">Permission levels</p>
                <div className="space-y-1.5">
                  {CONNECTOR_PERM_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-start gap-2">
                      <span className={cn('text-[10px] font-bold border rounded-full px-2 py-0.5 flex-shrink-0 mt-0.5', CONN_PERM_COLOR[opt.value])}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-brand-gray-dark">{opt.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-brand-gray-dark mb-2">Quick presets</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: 'Read only — all',  perm: 'READ'       as ConnectorPerm },
                    { label: 'Read + Write',      perm: 'READ_WRITE' as ConnectorPerm },
                    { label: 'Block all',         perm: 'NONE'       as ConnectorPerm },
                  ].map(({ label, perm }) => (
                    <button key={label} type="button"
                      onClick={() => setConnAccesses((prev) => prev.map((a) => ({ ...a, permission: perm })))}
                      className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-gray hover:border-brand-black transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-gray dark:border-dark-border flex-shrink-0">
          <span className={cn('text-xs font-medium transition-opacity duration-200', saved ? 'text-emerald-600 opacity-100' : 'opacity-0')}>
            Saved
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="button" onClick={save} disabled={saving}
              className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              Save permissions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit role modal ───────────────────────────────────────────────────────────

function EditRoleModal({ user, onClose, onSave }: {
  user: AdminUser; onClose: () => void; onSave: (id: string, role: PlatformRole) => void;
}) {
  const [role, setRole] = useState<PlatformRole>(user.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface-1 rounded-2xl shadow-2xl w-full max-w-sm border border-brand-gray dark:border-dark-border">
        <div className="flex items-center justify-between p-5 border-b border-brand-gray dark:border-dark-border">
          <h2 className="font-bold text-brand-black dark:text-white">Change platform role</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn w-8 h-8 p-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={user.name} src={user.avatar} size="sm" />
            <div>
              <p className="font-semibold text-sm text-brand-black dark:text-white">{user.name}</p>
              <p className="text-xs text-brand-gray-dark">{user.email}</p>
            </div>
          </div>
          <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">New role</label>
          <select aria-label="New platform role" value={role} onChange={(e) => setRole(e.target.value as PlatformRole)}
            className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="GUEST">Guest</option>
          </select>
          <p className="text-xs text-brand-gray-dark mt-2">
            Use <strong>Permissions</strong> to control access per workspace and connector.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-brand-gray dark:border-dark-border">
          <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
          <button type="button" onClick={() => { onSave(user.id, role); onClose(); }} className="btn-primary text-sm">Save role</button>
        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, iconPath }: { label: string; value: number; color: string; iconPath: string }) {
  return (
    <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4 hover:border-brand-black dark:hover:border-white/30 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={iconPath} />
          </svg>
        </div>
        <span className="text-2xl font-black text-brand-black dark:text-white">{value}</span>
      </div>
      <p className="text-xs text-brand-gray-dark font-medium">{label}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [permUser, setPermUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    if (isMockMode()) {
      setUsers(MOCK_ADMIN_USERS as AdminUser[]);
      setIsLoading(false);
      return;
    }
    api.get('/admin/users')
      .then((r) => setUsers(r.data.data ?? MOCK_ADMIN_USERS))
      .catch(() => setUsers(MOCK_ADMIN_USERS as AdminUser[]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSuspend = (id: string) => {
    setUsers((p) => p.map((u) => u.id === id ? { ...u, status: u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : u));
    api.patch(`/admin/users/${id}/status`, {}).catch(() => null);
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteUser.id}`);
      setUsers((p) => p.filter((u) => u.id !== deleteUser.id));
    } catch { /* keep user if API fails */ }
    finally { setDeleting(false); setDeleteUser(null); }
  };

  const handleRoleSave = (id: string, role: PlatformRole) => {
    setUsers((p) => p.map((u) => u.id === id ? { ...u, role } : u));
    api.patch(`/admin/users/${id}/role`, { role }).catch(() => null);
  };

  const filtered = users.filter((u) => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="relative space-y-8 animate-fade-in">
      <LinesPattern opacity={0.4} />

      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={(u) => setUsers((p) => [u, ...p])} />}
      {editUser && <EditRoleModal user={editUser} onClose={() => setEditUser(null)} onSave={handleRoleSave} />}
      {permUser && <PermissionsPanel user={permUser} onClose={() => setPermUser(null)} />}

      <ConfirmModal
        open={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete user"
        message={`Permanently delete ${deleteUser?.name ?? 'this user'}? This removes all their files, workspaces, and data and cannot be undone.`}
        confirmLabel="Delete permanently"
        danger
        loading={deleting}
      />

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            Create users, set platform roles, workspace access, and database permissions.
          </p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)}
          className="btn-primary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add user
        </button>
      </div>

      {/* Stats */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.length}
          color="bg-indigo-100 text-indigo-600" iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Active" value={users.filter((u) => u.status === 'ACTIVE').length}
          color="bg-emerald-100 text-emerald-600" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Managers +" value={users.filter((u) => ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(u.role)).length}
          color="bg-amber-100 text-amber-600" iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        <StatCard label="Pending" value={users.filter((u) => u.status === 'PENDING').length}
          color="bg-amber-100 text-amber-600" iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </div>

      {/* Filters */}
      <div className="relative z-10 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-52 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Search by name or email…" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 border border-brand-gray dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
        </div>
        <select aria-label="Filter by role" value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="text-sm border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
          <option value="all">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="MEMBER">Member</option>
          <option value="VIEWER">Viewer</option>
          <option value="GUEST">Guest</option>
        </select>
        <select aria-label="Filter by status" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="relative z-10 bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-2xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3 bg-brand-white-soft dark:bg-dark-surface-2 border-b border-brand-gray dark:border-dark-border">
          <div className="w-9" />
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider">User</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden md:block">Role</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider">Status</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden lg:block">Storage</div>
          <div className="text-[11px] font-semibold text-brand-gray-dark uppercase tracking-wider hidden lg:block">Last active</div>
          <div className="w-28" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-brand-gray dark:bg-dark-surface-2 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="font-semibold text-brand-black dark:text-white mb-1">No users found</p>
            <p className="text-sm text-brand-gray-dark">Try adjusting your filters</p>
          </div>
        ) : (
          paged.map((u) => {
            const role   = ROLE_CONFIG[u.role];
            const status = STATUS_CONFIG[u.status];
            const storagePct = Math.round((u.storageUsed / u.storageQuota) * 100);
            return (
              <div key={u.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 hover:bg-brand-white-soft dark:hover:bg-dark-surface-2 transition-colors border-b border-brand-gray dark:border-dark-border last:border-0 group">
                <Avatar name={u.name} src={u.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-brand-black dark:text-white truncate">{u.name}</p>
                  <p className="text-xs text-brand-gray-dark truncate">{u.email}</p>
                </div>
                <div className={cn('hidden md:flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border', role.bg, role.color)}>
                  {role.label}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', status.dot)} />
                  <span className="text-xs text-brand-black dark:text-white">{status.label}</span>
                </div>
                <div className="hidden lg:block">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-brand-gray dark:bg-dark-surface-2 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full', storagePct > 80 ? 'bg-brand-red' : storagePct > 60 ? 'bg-amber-400' : 'bg-brand-black dark:bg-white')}
                        ref={(el) => { if (el) el.style.width = `${storagePct}%`; }} />
                    </div>
                    <span className="text-[10px] text-brand-gray-dark">{storagePct}%</span>
                  </div>
                  <p className="text-[10px] text-brand-gray-dark mt-0.5">{formatBytes(u.storageUsed)}</p>
                </div>
                <div className="hidden lg:block text-xs text-brand-gray-dark">
                  {u.lastLoginAt ? formatRelativeTime(new Date(u.lastLoginAt)) : <span className="text-amber-600">Never</span>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => setPermUser(u)} className="icon-btn w-7 h-7 p-0" title="Data permissions">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setEditUser(u)} className="icon-btn w-7 h-7 p-0" title="Edit role">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => handleSuspend(u.id)}
                    className={cn('icon-btn w-7 h-7 p-0', u.status === 'SUSPENDED' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50')}
                    title={u.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}>
                    {u.status === 'SUSPENDED'
                      ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    }
                  </button>
                  <button type="button" onClick={() => setDeleteUser(u)} className="icon-btn w-7 h-7 p-0 text-red-600 hover:bg-red-50" title="Delete user">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-xs text-brand-gray-dark">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} users
          </p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page" className="icon-btn w-8 h-8 p-0 disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)}
                className={cn('w-8 h-8 text-sm font-semibold rounded-lg transition-colors',
                  p === page ? 'bg-brand-black dark:bg-white text-white dark:text-brand-black' : 'text-brand-gray-dark hover:bg-brand-white-soft dark:hover:bg-dark-surface-2')}>
                {p}
              </button>
            ))}
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page" className="icon-btn w-8 h-8 p-0 disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
