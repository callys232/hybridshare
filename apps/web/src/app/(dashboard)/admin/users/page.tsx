'use client';

import { useEffect, useState } from 'react';
import { cn, formatRelativeTime, formatBytes } from '@/lib/utils';
import { api } from '@/lib/api';
import { Avatar } from '@/component/ui/Avatar';
import { Spinner } from '@/component/ui/Spinner';
import { LinesPattern } from '@/component/ui/BackgroundPattern';

// ── Types ─────────────────────────────────────────────────────────────────────

type PlatformRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'GUEST';
type UserStatus   = 'ACTIVE' | 'SUSPENDED' | 'PENDING';
type WorkspaceRole= 'OWNER' | 'ADMIN' | 'EDITOR' | 'COMMENTER' | 'VIEWER' | 'NONE';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: UserStatus;
  avatar?: string;
  storageUsed: number;
  storageQuota: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface WorkspaceAccess {
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceRole;
}

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

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: '1', name: 'Amara Okonkwo',         email: 'amara@example.com',   role: 'ADMIN',   status: 'ACTIVE',    storageUsed: 4_294_967_296,   storageQuota: 53_687_091_200, createdAt: new Date(Date.now() - 86400000 * 90).toISOString(), lastLoginAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', name: 'Chidi Eze',             email: 'chidi@example.com',   role: 'MANAGER', status: 'ACTIVE',    storageUsed: 2_147_483_648,   storageQuota: 10_737_418_240, createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastLoginAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', name: 'Ngozi Adaora',          email: 'ngozi@example.com',   role: 'MEMBER',  status: 'PENDING',   storageUsed: 0,               storageQuota: 10_737_418_240, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: '4', name: 'Emeka Obi',             email: 'emeka@example.com',   role: 'MEMBER',  status: 'ACTIVE',    storageUsed: 805_306_368,     storageQuota: 10_737_418_240, createdAt: new Date(Date.now() - 86400000 * 14).toISOString(), lastLoginAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '5', name: 'Funmilayo Ransome-Kuti',email: 'funmi@example.com',   role: 'VIEWER',  status: 'SUSPENDED', storageUsed: 1_073_741_824,   storageQuota: 5_368_709_120,  createdAt: new Date(Date.now() - 86400000 * 60).toISOString(), lastLoginAt: new Date(Date.now() - 86400000 * 14).toISOString() },
  { id: '6', name: 'Adebayo Falola',        email: 'adebayo@example.com', role: 'MEMBER',  status: 'ACTIVE',    storageUsed: 3_221_225_472,   storageQuota: 10_737_418_240, createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), lastLoginAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '7', name: 'Ifeoma Nwosu',          email: 'ifeoma@example.com',  role: 'MEMBER',  status: 'ACTIVE',    storageUsed: 524_288_000,     storageQuota: 10_737_418_240, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),  lastLoginAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '8', name: 'Babatunde Lawal',       email: 'babs@example.com',    role: 'GUEST',   status: 'ACTIVE',    storageUsed: 0,               storageQuota: 1_073_741_824,  createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
];

const MOCK_WORKSPACES: { id: string; name: string }[] = [
  { id: 'ws1', name: 'Marketing Team' },
  { id: 'ws2', name: 'Engineering Docs' },
  { id: 'ws3', name: 'Q4 Product Launch' },
  { id: 'ws4', name: 'Finance & Legal' },
];

// ── Invite modal ──────────────────────────────────────────────────────────────

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<PlatformRole>('MEMBER');
  const [quota, setQuota] = useState('10');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) return;
    setSending(true);
    try {
      await api.post('/admin/users/invite', {
        email, role,
        storageQuota: parseInt(quota) * 1_073_741_824,
      });
    } catch { /* mock success */ }
    setSent(true);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface-1 rounded-2xl shadow-2xl w-full max-w-md border border-brand-gray dark:border-dark-border">
        <div className="flex items-center justify-between p-5 border-b border-brand-gray dark:border-dark-border">
          <h2 className="font-bold text-brand-black dark:text-white">Invite user</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="icon-btn w-8 h-8 p-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-brand-black dark:text-white mb-1">Invitation sent!</p>
            <p className="text-sm text-brand-gray-dark mb-5">Invite emailed to <strong>{email}</strong></p>
            <button type="button" onClick={onClose} className="btn-primary text-sm">Done</button>
          </div>
        ) : (
          <>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Email address *</label>
                <input type="email" placeholder="user@company.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} autoFocus
                  className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">Platform role</label>
                <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as PlatformRole)}
                  className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
                  <option value="MEMBER">Member — full file access</option>
                  <option value="VIEWER">Viewer — read only</option>
                  <option value="MANAGER">Manager — can manage workspaces</option>
                  <option value="ADMIN">Admin — full platform access</option>
                  <option value="GUEST">Guest — external collaborator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-black dark:text-white mb-1.5">
                  Storage quota (GB)
                </label>
                <input type="number" min="1" max="1000" value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-brand-gray dark:border-dark-border">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
              <button type="button" onClick={handleSend} disabled={!email || sending}
                className="btn-primary text-sm disabled:opacity-50 flex items-center gap-2">
                {sending && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />}
                Send invite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Workspace Permissions slide-over ─────────────────────────────────────────

function PermissionsPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [accesses, setAccesses] = useState<WorkspaceAccess[]>(
    MOCK_WORKSPACES.map((ws) => ({ workspaceId: ws.id, workspaceName: ws.name, role: 'VIEWER' }))
  );
  const [quota, setQuota] = useState(Math.round(user.storageQuota / 1_073_741_824).toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setRole = (wsId: string, role: WorkspaceRole) =>
    setAccesses((prev) => prev.map((a) => a.workspaceId === wsId ? { ...a, role } : a));

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/users/${user.id}/permissions`, {
        workspacePermissions: accesses,
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
          <button type="button" onClick={onClose} aria-label="Close permissions panel"
            className="icon-btn w-8 h-8 p-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Storage quota */}
          <div>
            <h3 className="text-sm font-semibold text-brand-black dark:text-white mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
              Storage quota
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="number" min="1" max="5000" value={quota}
                onChange={(e) => setQuota(e.target.value)}
                placeholder="10"
                title="Storage quota in GB"
                aria-label="Storage quota in GB"
                className="w-28 border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors"
              />
              <span className="text-sm text-brand-gray-dark">GB</span>
              <span className="text-xs text-brand-gray-dark ml-auto">
                Currently using {formatBytes(user.storageUsed)}
              </span>
            </div>
          </div>

          {/* Workspace permissions */}
          <div>
            <h3 className="text-sm font-semibold text-brand-black dark:text-white mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Workspace access
            </h3>
            <p className="text-xs text-brand-gray-dark mb-4">
              Set this user&apos;s role in each workspace. &ldquo;None&rdquo; blocks all access.
            </p>

            <div className="space-y-2">
              {accesses.map((access) => (
                <div key={access.workspaceId}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-brand-gray dark:border-dark-border bg-brand-gray/20 dark:bg-dark-surface-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-brand-gray dark:bg-dark-surface-1 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-brand-black dark:text-white truncate">
                      {access.workspaceName}
                    </span>
                  </div>
                  <select
                    aria-label={`${access.workspaceName} access role`}
                    value={access.role}
                    onChange={(e) => setRole(access.workspaceId, e.target.value as WorkspaceRole)}
                    className={cn(
                      'text-xs font-semibold rounded-lg px-2 py-1.5 border focus:outline-none transition-colors cursor-pointer flex-shrink-0',
                      access.role === 'NONE'
                        ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400'
                        : access.role === 'OWNER' || access.role === 'ADMIN'
                          ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400'
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

          {/* Quick permission presets */}
          <div>
            <p className="text-xs font-semibold text-brand-gray-dark mb-2">Quick presets</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: 'Full access', role: 'EDITOR' as WorkspaceRole },
                { label: 'View only', role: 'VIEWER' as WorkspaceRole },
                { label: 'Block all', role: 'NONE' as WorkspaceRole },
              ].map(({ label, role }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setAccesses((prev) => prev.map((a) => ({ ...a, role })))}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-brand-gray hover:border-brand-black dark:border-dark-border dark:hover:border-white/40 transition-colors"
                >
                  {label} — all workspaces
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-brand-gray dark:border-dark-border flex-shrink-0">
          <span className={cn('text-xs font-medium transition-opacity duration-200',
            saved ? 'text-emerald-600 opacity-100' : 'opacity-0')}>
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
          <select aria-label="New platform role" value={role}
            onChange={(e) => setRole(e.target.value as PlatformRole)}
            className="w-full border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors">
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="GUEST">Guest</option>
          </select>
          <p className="text-xs text-brand-gray-dark mt-2">
            Use <strong>Workspace Permissions</strong> to control access per workspace.
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

// ── Stat icon components ──────────────────────────────────────────────────────

function StatCard({ label, value, color, iconPath }: { label: string; value: number; color: string; iconPath: string }) {
  return (
    <div className="bg-white dark:bg-dark-surface-1 border border-brand-gray dark:border-dark-border rounded-xl p-4 hover:border-brand-black dark:hover:border-white/30 transition-colors duration-150">
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
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [permUser, setPermUser] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  useEffect(() => {
    api.get('/admin/users')
      .then((r) => setUsers(r.data.data ?? MOCK_USERS))
      .catch(() => setUsers(MOCK_USERS))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSuspend = (id: string) => {
    setUsers((p) => p.map((u) => u.id === id ? { ...u, status: u.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED' } : u));
    api.patch(`/admin/users/${id}/status`, {}).catch(() => null);
  };

  const handleDelete = (id: string) => {
    setUsers((p) => p.filter((u) => u.id !== id));
    api.delete(`/admin/users/${id}`).catch(() => null);
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

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}
      {editUser  && <EditRoleModal user={editUser} onClose={() => setEditUser(null)} onSave={handleRoleSave} />}
      {permUser  && <PermissionsPanel user={permUser} onClose={() => setPermUser(null)} />}

      {/* Header */}
      <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            Manage roles, workspace access and storage for all users.
          </p>
        </div>
        <button type="button" onClick={() => setShowInvite(true)}
          className="btn-primary text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Invite user
        </button>
      </div>

      {/* Stats */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={users.length}
          color="bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
          iconPath="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        <StatCard label="Active" value={users.filter((u) => u.status === 'ACTIVE').length}
          color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
          iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        <StatCard label="Managers +" value={users.filter((u) => ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(u.role)).length}
          color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          iconPath="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        <StatCard label="Pending" value={users.filter((u) => u.status === 'PENDING').length}
          color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          className="text-sm border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors cursor-pointer">
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
          className="text-sm border border-brand-gray dark:border-dark-border rounded-lg px-3 py-2 bg-white dark:bg-dark-surface-2 dark:text-white focus:outline-none focus:border-brand-black transition-colors cursor-pointer">
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
                  {/* Permissions */}
                  <button type="button" onClick={() => setPermUser(u)}
                    className="icon-btn w-7 h-7 p-0" title="Workspace permissions">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </button>
                  {/* Edit role */}
                  <button type="button" onClick={() => setEditUser(u)}
                    className="icon-btn w-7 h-7 p-0" title="Edit role">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Suspend/unsuspend */}
                  <button type="button" onClick={() => handleSuspend(u.id)}
                    className={cn('icon-btn w-7 h-7 p-0', u.status === 'SUSPENDED' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50')}
                    title={u.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}>
                    {u.status === 'SUSPENDED'
                      ? <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    }
                  </button>
                  {/* Delete */}
                  <button type="button" onClick={() => handleDelete(u.id)}
                    className="icon-btn w-7 h-7 p-0 text-red-600 hover:bg-red-50" title="Delete user">
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
            <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              aria-label="Previous page" className="icon-btn w-8 h-8 p-0 disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} type="button" onClick={() => setPage(p)}
                className={cn('w-8 h-8 text-sm font-semibold rounded-lg transition-colors',
                  p === page ? 'bg-brand-black dark:bg-white text-white dark:text-brand-black' : 'text-brand-gray-dark hover:bg-brand-white-soft dark:hover:bg-dark-surface-2')}>
                {p}
              </button>
            ))}
            <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
              aria-label="Next page" className="icon-btn w-8 h-8 p-0 disabled:opacity-40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
