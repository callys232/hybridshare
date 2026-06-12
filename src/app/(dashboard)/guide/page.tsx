'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTourStore } from '@/store/tour.store';

// ── Section data ──────────────────────────────────────────────────────────────
interface Step { title: string; body: string; }
interface Tip  { label: string; text: string; }
interface Feature { name: string; free: boolean; starter: boolean; pro: boolean; enterprise: boolean; }

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  steps?: Step[];
  tips?: Tip[];
  features?: Feature[];
  note?: string;
}

const SECTIONS: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Set up your account and learn your way around the platform in minutes.',
    color: 'text-blue-600 bg-blue-50 border-blue-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    steps: [
      { title: 'Complete your profile', body: 'Go to Settings → Profile and add your name, avatar, job title, and timezone. A complete profile helps teammates recognise you in shared workspaces and messages.' },
      { title: 'Verify your email', body: 'Click the verification link we sent on registration. Without a verified email you won\'t receive share notifications, file request alerts, or password reset links.' },
      { title: 'Enable two-factor authentication', body: 'Head to Settings → Security and scan the QR code with Google Authenticator or Authy. Each login will then require your 6-digit code, protecting your account even if your password leaks.' },
      { title: 'Create your first workspace', body: 'Workspaces organise files by team or project. Click Workspaces → New Workspace, give it a name and colour, then invite your first teammate.' },
      { title: 'Upload your first file', body: 'Open Files and drag-and-drop a document or click + Upload. Supported types include PDFs, Office documents, images, videos, and archives. All files are encrypted at rest using AES-256.' },
    ],
    tips: [
      { label: 'Pro tip', text: 'Use the Dashboard\'s quick-access cards to jump straight to Files, Workspaces, or Admin tools without hunting through the sidebar.' },
      { label: 'Shortcut', text: 'Press ⌘K (or Ctrl+K on Windows) anywhere in the app to open global search instantly.' },
    ],
  },
  {
    id: 'file-management',
    title: 'File Management',
    subtitle: 'Upload, organise, tag, and recover files with full version control.',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    steps: [
      { title: 'Upload files and folders', body: 'Drag files or entire folder trees onto the Files page. You can also click + Upload → Folder to preserve directory structure. Files larger than 5GB are supported on Pro and Enterprise plans.' },
      { title: 'Organise with folders', body: 'Right-click any empty area to create a folder. Drag-and-drop files between folders. Use the breadcrumb trail at the top to navigate back up your hierarchy.' },
      { title: 'Preview files in-browser', body: 'Click any file to open the in-browser preview. PDFs, images, videos, and Office documents can be viewed without downloading. Use the arrow keys to move between files in the same folder.' },
      { title: 'Bulk actions', body: 'Tick the checkbox on any file to enter multi-select mode. From there you can bulk download as ZIP, move to a folder, change permissions, or permanently delete multiple files at once.' },
      { title: 'Recover deleted files', body: 'Deleted files move to the Recycle Bin and are held for 30 days. Open Recycle Bin, select any file, and click Restore to return it to its original location. Permanently deleted files cannot be recovered.' },
    ],
    tips: [
      { label: 'Version history', text: 'Pro and Enterprise plans store up to 50 versions of each file. Right-click a file → Version History to view, download, or roll back to any previous version.' },
      { label: 'Tags', text: 'Add tags to files for cross-folder discovery. Tags appear in Search as filter chips — great for finding all files labelled "Q3 Report" regardless of where they live.' },
    ],
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    subtitle: 'Organise projects by team, control access, and manage libraries.',
    color: 'text-violet-600 bg-violet-50 border-violet-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    steps: [
      { title: 'Create a workspace', body: 'Click Workspaces → New Workspace. Give it a name, choose a colour for easy identification, and optionally add a description. A workspace acts as a shared container for files, libraries, and members.' },
      { title: 'Invite members', body: 'Open a workspace and click Members → Invite. Enter email addresses or search existing users. You can invite multiple people at once by separating emails with commas.' },
      { title: 'Assign roles', body: 'Each member has a role: Viewer (read-only), Editor (upload, rename, delete own files), Admin (full control including inviting others). Roles can be changed at any time from the Members list.' },
      { title: 'Create libraries', body: 'Libraries are named collections within a workspace — think of them as smart folders. Create a library for each document type (e.g. Contracts, Proposals, Reports) and pin it to the workspace homepage.' },
      { title: 'Archive or delete a workspace', body: 'Archiving hides the workspace from the sidebar but preserves all files. Deleting permanently removes all content. Both actions are reversible only within 30 days (Enterprise) or 7 days (Pro).' },
    ],
    tips: [
      { label: 'Workspace colour', text: 'The sidebar shows a colour dot for each workspace. Use distinct colours so teammates can instantly identify which workspace they\'re in at a glance.' },
      { label: 'Workspace limit', text: 'Free and Starter plans allow 3 workspaces. Pro allows 20. Enterprise has no limit. Upgrade under Settings → Billing to unlock more.' },
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing & File Requests',
    subtitle: 'Share files securely with external parties and collect uploads without accounts.',
    color: 'text-amber-600 bg-amber-50 border-amber-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    steps: [
      { title: 'Create a public share link', body: 'Click the share icon on any file. A unique link is generated. Recipients can view and optionally download the file without logging in — no account required.' },
      { title: 'Set link permissions', body: 'Choose whether recipients can view only or also download. You can also toggle whether the link shows file metadata (size, modified date) to prevent information leakage.' },
      { title: 'Add a password', body: 'Enable link password protection to require a passphrase before viewing. Passwords are hashed — not even admins can read them. Share the password out-of-band for best security.' },
      { title: 'Set an expiry date', body: 'Links can expire after a custom date or after a maximum number of views (e.g. "self-destruct after 10 views"). Expired links show a friendly "This link has expired" message.' },
      { title: 'Create a file request', body: 'File Requests let anyone upload files to your workspace — no account needed. Create a request, name it, set an optional deadline, and share the upload URL. Incoming files appear in your workspace automatically.' },
    ],
    tips: [
      { label: 'Manage all links', text: 'The Shared Links page lists every active link: recipient count, view count, and expiry status. Revoke any link instantly from here.' },
      { label: 'Notify uploader', text: 'When someone uploads via a File Request, you\'ll receive an in-app notification and (on Pro+) an email alert.' },
    ],
  },
  {
    id: 'connectors',
    title: 'Connectors',
    subtitle: 'Sync files and data from Google Drive, S3, databases, and CRMs.',
    color: 'text-sky-600 bg-sky-50 border-sky-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    steps: [
      { title: 'Add a connector', body: 'Go to Connectors and click + New Connector. Choose a provider — Cloud Storage (Google Drive, Amazon S3, Dropbox, OneDrive), Database (PostgreSQL, MySQL, MongoDB), or CRM (Airtable, HubSpot, Salesforce).' },
      { title: 'Authorise access', body: 'Cloud connectors use OAuth — click Authorise and log in with the provider account. Database connectors require host, port, name, username, and password. CRM connectors may use an API key.' },
      { title: 'Configure sync schedule', body: 'Set whether files sync once (on demand) or on a recurring schedule (every hour, daily, or weekly). Changes on the external source are reflected in Lamid FileShare on the next sync cycle.' },
      { title: 'Set user access', body: 'Go to Admin → User Management → Permissions to control which users can access each connector. Access levels are: None, Read, Read+Write, and Full (which includes deleting records).' },
      { title: 'Monitor sync status', body: 'The Connectors list shows last-sync time, sync status (Healthy / Warning / Error), and the number of records/files imported. Click any connector to see a detailed sync log.' },
    ],
    tips: [
      { label: 'S3 tip', text: 'For Amazon S3, create a dedicated IAM user with s3:GetObject, s3:PutObject, and s3:ListBucket permissions on just the target bucket. Never use root credentials.' },
      { label: 'PostgreSQL tip', text: 'We recommend a read-only database user for read-only connectors. Grant only SELECT on the tables you need — this limits blast radius if credentials are ever compromised.' },
    ],
  },
  {
    id: 'collaboration',
    title: 'Team Collaboration',
    subtitle: 'Messages, tasks, and the social feed to keep your team aligned.',
    color: 'text-pink-600 bg-pink-50 border-pink-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    steps: [
      { title: 'Send a direct message', body: 'Open the Messages page and click + New Message to start a conversation with any workspace member. The top bar chat icon shows unread counts at a glance and lets you preview recent messages without leaving your current page.' },
      { title: 'Read receipts', body: 'A double-tick appears next to each message once all participants have read it. You can see who has read a message by hovering or tapping the tick.' },
      { title: 'Create and assign tasks', body: 'Open Tasks and click + New Task. Give it a title, due date, and assign it to any workspace member. Tasks linked to a workspace appear on the workspace homepage so the whole team can track progress.' },
      { title: 'Post to the Social feed', body: 'The Social feed is your team\'s activity board. Post updates, share links, celebrate milestones, or attach files directly from your workspace. Teammates can react and reply in threads.' },
      { title: 'Notification preferences', body: 'Go to Settings → Notifications to control which events generate alerts: file shares, task assignments, new messages, connector syncs, and more. Each category can be toggled independently.' },
    ],
    tips: [
      { label: 'Quick reply', text: 'In the Messages top-bar drawer, press Enter to send without opening the full inbox. Shift+Enter adds a line break.' },
      { label: 'Mentions', text: 'In the Social feed, type @ followed by a teammate\'s name to mention them. They\'ll receive an in-app and email notification even if they\'re not watching the feed.' },
    ],
  },
  {
    id: 'security',
    title: 'Security & Compliance',
    subtitle: 'Protect your data with enterprise-grade controls and audit logging.',
    color: 'text-red-600 bg-red-50 border-red-100',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    features: [
      { name: 'Two-factor authentication (TOTP)', free: true, starter: true, pro: true, enterprise: true },
      { name: 'AES-256 encryption at rest', free: true, starter: true, pro: true, enterprise: true },
      { name: 'TLS 1.3 in transit', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Audit log (7 days)', free: true, starter: true, pro: false, enterprise: false },
      { name: 'Audit log (90 days)', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Audit log (unlimited)', free: false, starter: false, pro: false, enterprise: true },
      { name: 'SAML 2.0 / SSO', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Custom data-retention policy', free: false, starter: false, pro: false, enterprise: true },
      { name: 'IP allowlisting', free: false, starter: false, pro: false, enterprise: true },
      { name: 'HIPAA / SOC 2 compliance docs', free: false, starter: false, pro: false, enterprise: true },
    ],
    steps: [
      { title: 'Enable 2FA', body: 'Settings → Security → Two-Factor Authentication. Scan the QR code with your authenticator app, enter the first 6-digit code to confirm, and save. If you lose your device, use one of the 8 backup codes shown at setup.' },
      { title: 'Review the Audit Log', body: 'Admin → Activity shows every action in the platform: uploads, downloads, shares, deletions, login attempts, and connector syncs. Filter by user, date range, or event type and export as CSV.' },
      { title: 'Set a data-retention policy (Enterprise)', body: 'Settings → Organisation → Data Retention lets you define how long deleted files stay in the Recycle Bin before automatic purge. Options: 7, 30, 90, 180, or 365 days — or disable auto-purge entirely.' },
      { title: 'Configure SSO (Enterprise)', body: 'Settings → Organisation → SSO. Paste your Identity Provider\'s metadata XML or enter the SSO URL, certificate, and entity ID manually. Once active, users sign in via your IdP and account creation is managed there.' },
    ],
    note: 'Need a HIPAA Business Associate Agreement or SOC 2 Type II report? Contact sales@lamidgroup.com — Enterprise customers receive compliance documentation upon request.',
  },
  {
    id: 'admin',
    title: 'Admin & Analytics',
    subtitle: 'Manage users, monitor storage, and integrate via the REST API.',
    color: 'text-slate-600 bg-slate-50 border-slate-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    steps: [
      { title: 'Manage users', body: 'Admin → User Management lists every account with role, status, and last-seen date. Click any user to edit their role, reset their password, suspend their account, or delete it. Bulk actions are available via the checkbox column.' },
      { title: 'Invite users via email', body: 'Click + Add User → Invite via Email. A sign-up link is emailed to the address. The link expires after 48 hours. Uninvited links can be resent or revoked from the Pending Invitations tab.' },
      { title: 'Monitor storage', body: 'Admin → Analytics shows storage usage broken down by workspace and file type, plus upload volume over the last 30 days and active user counts. Use the date-range picker to export a CSV report.' },
      { title: 'Generate API keys', body: 'Settings → API Keys. Click + New Key, give it a descriptive name and optionally restrict it to specific IP ranges. Copy the key immediately — it\'s only shown once. Use it in the Authorization: Bearer <key> header.' },
      { title: 'Configure webhooks', body: 'Settings → Organisation → Webhooks. Enter a HTTPS endpoint URL and select the event types to receive (file.uploaded, share.created, user.invited, connector.synced, etc.). We send JSON payloads with HMAC-SHA256 signatures.' },
    ],
    tips: [
      { label: 'API reference', text: 'Full REST API documentation with request/response examples is available at /api/docs once you generate your first API key.' },
      { label: 'Webhook retries', text: 'If your endpoint returns a non-2xx status, we retry the webhook up to 5 times with exponential back-off (1s, 2s, 4s, 8s, 16s). Failed deliveries appear in the webhook delivery log.' },
    ],
  },
];

// ── Small sub-components ──────────────────────────────────────────────────────
function CheckIcon({ on }: { on: boolean }) {
  return on ? (
    <svg className="w-4 h-4 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-brand-gray mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StepCard({ num, step }: { num: number; step: Step }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-black text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {num}
      </div>
      <div className="flex-1 pb-5 border-b border-brand-gray last:border-0 last:pb-0">
        <p className="text-sm font-semibold text-brand-black mb-1">{step.title}</p>
        <p className="text-sm text-brand-gray-dark leading-relaxed">{step.body}</p>
      </div>
    </div>
  );
}

function TipCard({ tip }: { tip: Tip }) {
  return (
    <div className="flex gap-3 p-3.5 bg-brand-red/5 border border-brand-red/15 rounded-xl">
      <svg className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <div>
        <span className="text-xs font-bold text-brand-red uppercase tracking-wide">{tip.label} — </span>
        <span className="text-xs text-brand-gray-dark leading-relaxed">{tip.text}</span>
      </div>
    </div>
  );
}

// ── Section component ─────────────────────────────────────────────────────────
function SectionBlock({ section }: { section: Section }) {
  return (
    <section id={section.id} className="scroll-mt-24">
      {/* Header */}
      <div className={cn('flex items-center gap-3 p-4 rounded-xl border mb-6', section.color)}>
        <div className="flex-shrink-0">{section.icon}</div>
        <div>
          <h2 className="text-base font-bold leading-tight">{section.title}</h2>
          <p className="text-xs opacity-80 mt-0.5">{section.subtitle}</p>
        </div>
      </div>

      {/* Steps */}
      {section.steps && section.steps.length > 0 && (
        <div className="space-y-0 mb-6">
          {section.steps.map((step, i) => (
            <StepCard key={i} num={i + 1} step={step} />
          ))}
        </div>
      )}

      {/* Feature comparison table */}
      {section.features && (
        <div className="mb-6 overflow-x-auto rounded-xl border border-brand-gray">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-brand-white-soft border-b border-brand-gray">
                <th className="text-left px-4 py-2.5 font-semibold text-brand-black w-1/2">Feature</th>
                {['Free', 'Starter', 'Pro', 'Enterprise'].map((p) => (
                  <th key={p} className="text-center px-3 py-2.5 font-semibold text-brand-black">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.features.map((f, i) => (
                <tr key={i} className={cn('border-b border-brand-gray last:border-0', i % 2 === 1 && 'bg-brand-white-soft/50')}>
                  <td className="px-4 py-2.5 text-brand-gray-dark">{f.name}</td>
                  <td className="px-3 py-2.5"><CheckIcon on={f.free} /></td>
                  <td className="px-3 py-2.5"><CheckIcon on={f.starter} /></td>
                  <td className="px-3 py-2.5"><CheckIcon on={f.pro} /></td>
                  <td className="px-3 py-2.5"><CheckIcon on={f.enterprise} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tips */}
      {section.tips && section.tips.length > 0 && (
        <div className="space-y-2.5 mb-6">
          {section.tips.map((tip, i) => (
            <TipCard key={i} tip={tip} />
          ))}
        </div>
      )}

      {/* Compliance note */}
      {section.note && (
        <div className="flex gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {section.note}
        </div>
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuidePage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [search, setSearch] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const { start: startTour } = useTourStore();

  // Highlight active section on scroll
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleScroll = () => {
      let current = SECTIONS[0].id;
      for (const s of SECTIONS) {
        const node = document.getElementById(s.id);
        if (node && node.getBoundingClientRect().top <= 120) current = s.id;
      }
      setActiveId(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const filtered = search.trim()
    ? SECTIONS.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.subtitle.toLowerCase().includes(search.toLowerCase()) ||
        s.steps?.some((st) => st.title.toLowerCase().includes(search.toLowerCase()) || st.body.toLowerCase().includes(search.toLowerCase()))
      )
    : SECTIONS;

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-dark-surface-1 border-b border-brand-gray dark:border-dark-border px-8 py-6 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 max-w-5xl">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-brand-red/10 to-brand-red/5 border border-brand-red/20 text-brand-red text-[10px] font-bold uppercase tracking-widest">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Premium User Guide
              </span>
            </div>
            <h1 className="text-2xl font-bold text-brand-black dark:text-dark-text">
              Lamid FileShare — Complete Guide
            </h1>
            <p className="text-sm text-brand-gray-dark dark:text-dark-text-muted mt-1">
              Everything you need to master every feature — from first upload to enterprise SSO.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={startTour}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-gray text-xs font-semibold text-brand-gray-dark hover:text-brand-black hover:border-brand-gray-dark transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Interactive Tour
            </button>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-gray text-xs font-semibold text-brand-gray-dark hover:text-brand-black hover:border-brand-gray-dark transition-all duration-150"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </a>
            <Link
              href="/settings/billing"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-red text-white text-xs font-semibold hover:bg-brand-red-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade Plan
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the guide…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-brand-gray rounded-lg bg-brand-white-soft dark:bg-dark-surface-2 dark:border-dark-border dark:text-dark-text placeholder:text-brand-gray-dark focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red/60 transition-all"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-gray-dark hover:text-brand-black"
              aria-label="Clear search">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left TOC — sticky */}
        <aside className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-1 overflow-y-auto py-5 px-3">
          <p className="text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest px-3 mb-3">Contents</p>
          {SECTIONS.map((s) => {
            const isActive = activeId === s.id && !search;
            const inResult = !search || filtered.some((f) => f.id === s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSearch(''); scrollTo(s.id); }}
                className={cn(
                  'flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150',
                  !inResult && 'opacity-30',
                  isActive
                    ? 'bg-brand-red/8 text-brand-red font-semibold'
                    : 'text-brand-gray-dark hover:text-brand-black hover:bg-brand-white-soft dark:hover:bg-dark-surface-2'
                )}
              >
                <span className={cn('flex-shrink-0 transition-colors', isActive ? 'text-brand-red' : 'text-brand-gray-dark')}>
                  {s.icon}
                </span>
                {s.title}
                {isActive && (
                  <span className="ml-auto w-1 h-4 rounded-full bg-brand-red flex-shrink-0" />
                )}
              </button>
            );
          })}

          {/* Quick links */}
          <div className="mt-6 pt-4 border-t border-brand-gray px-3 space-y-1">
            <p className="text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest mb-2">Quick Links</p>
            {[
              { label: 'Files', href: '/files' },
              { label: 'Connectors', href: '/connectors' },
              { label: 'Security', href: '/settings/security' },
              { label: 'API Keys', href: '/settings/api-keys' },
              { label: 'Billing', href: '/settings/billing' },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-1.5 text-xs text-brand-gray-dark hover:text-brand-red transition-colors py-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {l.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main ref={contentRef} className="flex-1 overflow-y-auto px-6 md:px-10 py-8 max-w-3xl">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-10 h-10 text-brand-gray mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-brand-black mb-1">No results for &ldquo;{search}&rdquo;</p>
              <p className="text-xs text-brand-gray-dark">Try a different keyword or <button type="button" className="text-brand-red hover:underline" onClick={() => setSearch('')}>clear the search</button>.</p>
            </div>
          ) : (
            <div className="space-y-14">
              {filtered.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}

              {/* Footer CTA */}
              {!search && (
                <div className="rounded-2xl bg-gradient-to-br from-brand-black to-brand-red p-6 text-white text-center">
                  <p className="text-lg font-bold mb-1">Need more power?</p>
                  <p className="text-sm text-white/70 mb-4">Enterprise plan unlocks SSO, unlimited storage, compliance docs, and a dedicated account manager.</p>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Link
                      href="/settings/billing"
                      className="px-5 py-2 bg-white text-brand-black text-sm font-bold rounded-lg hover:bg-brand-white-soft transition-colors"
                    >
                      View Plans
                    </Link>
                    <a
                      href="mailto:sales@lamidgroup.com"
                      className="px-5 py-2 border border-white/30 text-white text-sm font-semibold rounded-lg hover:bg-white/10 transition-colors"
                    >
                      Contact Sales
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
