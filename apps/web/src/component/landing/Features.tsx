'use client';

import { useState } from 'react';
import { NodesPattern } from '@/component/ui/BackgroundPattern';
import { FeatureModal, type FeatureDetail } from './FeatureModal';

// ── Icon helpers ──────────────────────────────────────────────────────────────
const icon = (d: string) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
  </svg>
);

// ── Feature data ──────────────────────────────────────────────────────────────
const FEATURES: FeatureDetail[] = [
  {
    title:   'Secure File Storage',
    badge:   'Storage',
    tagline: 'Upload, organise and version-control every file.',
    color:   'text-blue-600 bg-blue-50 border-blue-200',
    icon:    icon('M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z'),
    desc:    'Upload, organise, and version-control every file. Encrypted at rest, backed up, and always accessible.',
    videoId: null,
    videoTitle: 'Secure File Storage Demo',
    description:
      'HybridShare gives your team a single source of truth for all files. Every upload is encrypted in transit and at rest, automatically versioned, and backed up across multiple availability zones. You can organise files into deeply nested folder hierarchies, tag them for fast retrieval, and lock individual files to prevent concurrent edits.',
    benefits: [
      { title: 'Version history',     icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', desc: 'Every save is a new version. Restore any previous state in one click — no more "final_v3_REAL.docx".' },
      { title: 'File locking',         icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', desc: 'Lock a file while editing to prevent teammates from overwriting your in-progress changes.' },
      { title: 'Smart search',          icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', desc: 'Search by filename, tag, workspace, or uploader. Results appear in milliseconds using Meilisearch.' },
      { title: 'Virus scanning',        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', desc: 'Every uploaded file is scanned for malware before it is stored. Infected files are quarantined instantly.' },
    ],
  },
  {
    title:   'Team Workspaces',
    badge:   'Collaboration',
    tagline: 'Organised, permission-controlled spaces for every team.',
    color:   'text-violet-600 bg-violet-50 border-violet-200',
    icon:    icon('M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'),
    desc:    'Create team, project, and department workspaces with role-based access control and member management.',
    videoId: null,
    videoTitle: 'Team Workspaces Demo',
    description:
      'Create dedicated workspaces for teams, projects, departments, or clients. Each workspace has its own storage quota, member list, role hierarchy, and activity feed. Owners can grant granular permissions — from read-only viewers to full editors — at the workspace, folder, or individual file level.',
    benefits: [
      { title: 'Role-based access',    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', desc: 'Assign Owner, Admin, Editor, Commenter, or Viewer roles per workspace. Override at folder level for sensitive areas.' },
      { title: 'Storage quotas',        icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', desc: 'Set per-workspace storage limits. Admins receive alerts when workspaces approach their cap.' },
      { title: 'Activity feeds',        icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'A timestamped feed shows every upload, edit, share, and delete across the workspace in real time.' },
      { title: 'Guest access',          icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z', desc: 'Invite external collaborators as guests — they see only the folders and files you explicitly share.' },
    ],
  },
  {
    title:   'Smart Connectors',
    badge:   'Integrations',
    tagline: 'Sync data from 23+ cloud, database, and CRM sources.',
    color:   'text-emerald-600 bg-emerald-50 border-emerald-200',
    icon:    icon('M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'),
    desc:    'Sync from 23+ sources — Google Drive, OneDrive, Dropbox, S3, MySQL, PostgreSQL, Airtable and more.',
    videoId: null,
    videoTitle: 'Smart Connectors Demo',
    description:
      'Stop copying files between tools manually. HybridShare connectors pull assets from cloud drives, object storage, databases, CRMs, and spreadsheets into a unified view. Sync on a schedule, trigger manually, or stream live changes. Each connector stores its credentials encrypted with AES-256 and never exposes tokens in logs.',
    benefits: [
      { title: 'One-click connect',    icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', desc: 'OAuth or credential-based setup in under 2 minutes. No engineering work required.' },
      { title: 'Scheduled sync',       icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Set sync intervals from 5 minutes to daily. Each run logs assets added, updated, and removed.' },
      { title: 'Unified asset view',   icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', desc: 'All synced assets appear in a single browsable library alongside your native files — no app-switching.' },
      { title: 'Sync error alerts',    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', desc: 'If a connector fails authentication or times out, admins are alerted immediately via email and in-app notification.' },
    ],
  },
  {
    title:   'Secure Sharing',
    badge:   'Sharing',
    tagline: 'Send files to anyone — with full control over access.',
    color:   'text-amber-600 bg-amber-50 border-amber-200',
    icon:    icon('M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'),
    desc:    'Share files with password-protected links, expiry dates, download limits, and per-view analytics.',
    videoId: null,
    videoTitle: 'Secure Sharing Demo',
    description:
      'Generate shareable links with fine-grained controls: require a password, set an expiry date, cap the number of downloads, and choose whether viewers can re-share or only view. Every link visit is logged — you see the viewer\'s location, device, and time. Revoke access instantly at any point with a single click.',
    benefits: [
      { title: 'Password protection',  icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', desc: 'Require a password before anyone can open the link — essential for confidential documents.' },
      { title: 'Expiry dates',          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', desc: 'Links auto-expire after your chosen date. No chasing people to delete old emails.' },
      { title: 'View analytics',        icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', desc: 'See who opened your link, from which country, and how many times — updated in real time.' },
      { title: 'Instant revocation',   icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', desc: 'Revoke any link immediately. Shared links that are already open lose access the next time they reload.' },
    ],
  },
  {
    title:   'Enterprise Security',
    badge:   'Security',
    tagline: 'SSO, 2FA, audit logs, and compliance built-in.',
    color:   'text-red-600 bg-red-50 border-red-200',
    icon:    icon('M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'),
    desc:    'SSO/SAML, 2FA, audit logs, data classification, IP allowlisting — built for organisations that take compliance seriously.',
    videoId: null,
    videoTitle: 'Enterprise Security Demo',
    description:
      'HybridShare was built with enterprise compliance in mind. Every user action is written to an immutable audit log. You can enforce SAML SSO from your identity provider, require TOTP two-factor authentication for all users, restrict access by IP range, classify files by sensitivity (Public / Internal / Confidential / Restricted), and export full audit reports to CSV for compliance reviews.',
    benefits: [
      { title: 'SAML / SSO',           icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', desc: 'Connect your Okta, Azure AD, or any SAML 2.0 IdP. Users log in with existing company credentials.' },
      { title: 'Two-factor auth',       icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', desc: 'Enforce TOTP 2FA platform-wide or per-role. Backup codes generated at setup.' },
      { title: 'Immutable audit log',   icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', desc: 'Every upload, download, share, edit, and deletion is logged with actor, IP, and timestamp — export to CSV.' },
      { title: 'Data classification',   icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', desc: 'Label files as Public, Internal, Confidential, or Restricted. Restricted files block link sharing automatically.' },
    ],
  },
  {
    title:   'Analytics & Reports',
    badge:   'Analytics',
    tagline: 'Storage, access, and activity insights at a glance.',
    color:   'text-indigo-600 bg-indigo-50 border-indigo-200',
    icon:    icon('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'),
    desc:    'Storage usage, share-link analytics, access reports and full audit trails — exported to CSV at any time.',
    videoId: null,
    videoTitle: 'Analytics & Reports Demo',
    description:
      'Make data-driven decisions about your file infrastructure. Track storage growth per workspace and per user, see which files are accessed most frequently, monitor share-link engagement by view count and geography, and run full audit reports filtered by user, action, date range, or resource type. All charts are exportable as CSV or PNG.',
    benefits: [
      { title: 'Storage breakdown',    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4', desc: 'Visualise storage used by workspace, user, file type, and date range. Spot overuse before it hits limits.' },
      { title: 'Share-link analytics', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z', desc: 'See view counts, download counts, referrer sources, and viewer countries for every shared link.' },
      { title: 'Access patterns',       icon: 'M13 10V3L4 14h7v7l9-11h-7z', desc: 'Find your most-accessed files and least-active workspaces to optimise storage allocation and archiving.' },
      { title: 'CSV / PNG export',      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4', desc: 'Export any report as a CSV for spreadsheet processing, or as a PNG chart for stakeholder presentations.' },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Features() {
  const [active, setActive] = useState<FeatureDetail | null>(null);

  return (
    <section id="features" className="relative py-24 bg-white overflow-hidden">
      <NodesPattern opacity={0.35} />
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <span className="text-xs font-bold text-brand-red uppercase tracking-widest">Platform capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-black text-brand-black mt-2 mb-3">
            Everything your team needs
          </h2>
          <p className="text-brand-gray-dark text-lg max-w-xl mx-auto">
            One platform replacing a stack of disconnected storage, sharing, and integration tools.
          </p>
          <p className="text-sm text-brand-gray-dark mt-2 opacity-70">
            Click any feature to see a detailed breakdown and demo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              type="button"
              onClick={() => setActive(f)}
              className="group text-left p-6 border border-brand-gray rounded-2xl hover:border-brand-black hover:shadow-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red active:scale-[0.98]"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 transition-transform duration-200 group-hover:scale-110 ${f.color}`}>
                {f.icon}
              </div>

              {/* Text */}
              <h3 className="font-bold text-brand-black mb-2 group-hover:text-brand-red transition-colors duration-150">
                {f.title}
              </h3>
              <p className="text-sm text-brand-gray-dark leading-relaxed">{f.desc}</p>

              {/* "See demo" nudge — appears on hover */}
              <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-brand-red opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch demo
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      <FeatureModal feature={active} onClose={() => setActive(null)} />
    </section>
  );
}
