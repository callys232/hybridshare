'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

// ── Types ────────────────────────────────────────────────────────────────────
interface BotAction { label: string; href: string; }
interface ChatMsg {
  id: string;
  role: 'user' | 'bot';
  text: string;
  actions?: BotAction[];
}

// ── Inline markdown bold: **text** → <strong> ────────────────────────────────
function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
      )}
    </>
  );
}

// ── SVG icons ────────────────────────────────────────────────────────────────
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

// ── Response rules ────────────────────────────────────────────────────────────
const RULES: { patterns: (string | RegExp)[]; text: string; actions?: BotAction[] }[] = [
  {
    patterns: [/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)\b/],
    text: "Hi! I'm **Lamid AI**, your smart assistant for Lamid FileShare. I can help with files, workspaces, connectors, messaging, billing, and more. What would you like to do?",
    actions: [{ label: 'Browse Files', href: '/files' }, { label: 'My Workspaces', href: '/workspaces' }],
  },
  {
    patterns: ['upload', 'add file', 'new file', 'import file', 'drag'],
    text: "Go to **Files** and click the **+ Upload** button. You can drag-and-drop files or whole folders. We support PDFs, Office docs, images, videos, archives, and more — all encrypted at rest.",
    actions: [{ label: 'Files', href: '/files' }],
  },
  {
    patterns: ['download', 'save file', 'export file', 'get file'],
    text: "Open **Files**, click the three-dot menu on any file, and select **Download**. You can also bulk-select multiple files and download them as a ZIP archive.",
    actions: [{ label: 'Files', href: '/files' }],
  },
  {
    patterns: ['share link', 'public link', 'share file', 'send a file', 'share with', 'sharing'],
    text: "Click the share icon on any file in **Files** to create a secure public link. You can set an expiry date, require a password, and control whether recipients can download. Manage all active links from **Shared Links**.",
    actions: [{ label: 'Files', href: '/files' }, { label: 'Shared Links', href: '/shared' }],
  },
  {
    patterns: ['file request', 'request file', 'collect file', 'receive file', 'upload request'],
    text: "**File Requests** let anyone upload files directly to your workspace — no account needed. Create a request, set an optional deadline, and share the upload link.",
    actions: [{ label: 'File Requests', href: '/file-requests' }],
  },
  {
    patterns: ['delete', 'remove file', 'trash', 'recycle', 'restore', 'recover', 'deleted file'],
    text: "Deleted files move to the **Recycle Bin** and are held for 30 days. You can restore them at any time from there. To free storage immediately, open the Recycle Bin and permanently delete the files.",
    actions: [{ label: 'Recycle Bin', href: '/recycle-bin' }],
  },
  {
    patterns: ['workspace', 'create workspace', 'new workspace', 'manage workspace', 'project space'],
    text: "Workspaces organise content by team or project. Go to **Workspaces**, click **New Workspace**, give it a name and colour, then start adding members and libraries. Each workspace has its own permission roles.",
    actions: [{ label: 'Workspaces', href: '/workspaces' }],
  },
  {
    patterns: ['invite', 'add member', 'add user', 'add people', 'team member', 'colleague'],
    text: "Go to **Admin → User Management** and click **Add user**. You can create accounts directly with an auto-generated password, or invite via email. From there you can also set workspace roles and connector access per user.",
    actions: [{ label: 'User Management', href: '/admin/users' }],
  },
  {
    patterns: ['connector', 'integration', 'connect source', 'data source', 'sync data', 'link database'],
    text: "**Connectors** link Lamid FileShare to external databases, cloud storage, and CRMs. Go to Connectors and choose your provider — we support Google Drive, Amazon S3, PostgreSQL, Airtable, and more.",
    actions: [{ label: 'Connectors', href: '/connectors' }],
  },
  {
    patterns: ['postgres', 'postgresql', 'mysql', 'database', 'sql', 'db connector'],
    text: "For a **Database connector**, go to Connectors and select a Database type (e.g. PostgreSQL). Enter your host, port, database name, username, and password. We validate the connection before saving, then sync on a schedule you control.",
    actions: [{ label: 'Connectors', href: '/connectors' }],
  },
  {
    patterns: ['google drive', 'amazon s3', 's3 bucket', 'cloud storage', 'dropbox', 'onedrive'],
    text: "**Cloud storage connectors** like Google Drive and Amazon S3 import external files into Lamid FileShare. Head to Connectors, pick your cloud provider, authorise access, and the files will sync automatically.",
    actions: [{ label: 'Connectors', href: '/connectors' }],
  },
  {
    patterns: ['airtable', 'crm', 'salesforce', 'hubspot', 'customer data', 'crm connector'],
    text: "**CRM connectors** (like Airtable) bring customer records into your workspace alongside documents. Set one up under Connectors → CRM. You control read/write access per user in **Admin → User Management**.",
    actions: [{ label: 'Connectors', href: '/connectors' }],
  },
  {
    patterns: ['message', 'chat', 'inbox', 'direct message', 'dm', 'send message', 'team chat'],
    text: "Use the **Messages** page to chat with teammates. The chat bubble icon in the top bar gives a quick preview of your conversations with unread counts. Click any thread to read and reply — sent messages show a read receipt.",
    actions: [{ label: 'Messages', href: '/messages' }],
  },
  {
    patterns: ['notification', 'alert', 'bell icon', 'remind', 'notify me'],
    text: "Notifications appear in the **bell icon** in the top bar. You can view all of them on the Notifications page, and customise which events trigger alerts (shares, mentions, connector syncs) in **Settings → Notifications**.",
    actions: [{ label: 'Notifications', href: '/notifications' }, { label: 'Notification Settings', href: '/settings/notifications' }],
  },
  {
    patterns: ['search', 'find file', 'find document', 'look for', 'full-text', 'locate file'],
    text: "The **Search** page supports full-text search across all files, workspaces, and libraries. Use the top bar for quick searches. For advanced queries use `AND`, `OR`, and `\"exact phrases\"` syntax.",
    actions: [{ label: 'Search', href: '/search' }],
  },
  {
    patterns: ['activity', 'audit', 'history', 'recent action', 'log', 'who did', 'audit trail'],
    text: "The **Activity** page shows a real-time audit trail — uploads, downloads, shares, deletions, and connector syncs. Admins see organisation-wide activity. Filter by user, date, or event type.",
    actions: [{ label: 'Activity', href: '/activity' }],
  },
  {
    patterns: ['billing', 'upgrade', 'plan', 'subscription', 'pricing', 'enterprise plan', 'pro plan', 'cost'],
    text: "View your plan and upgrade under **Settings → Billing**. We offer Free, Starter, Pro, and Enterprise tiers. Enterprise includes unlimited storage, SSO, and a dedicated support manager. To talk to sales, email sales@lamidgroup.com.",
    actions: [{ label: 'Billing & Plans', href: '/settings/billing' }],
  },
  {
    patterns: ['api key', 'api token', 'developer', 'webhook', 'programmatic', 'rest api'],
    text: "API keys are managed under **Settings → API Keys**. Generate keys for programmatic access to files, workspaces, and connectors. Webhooks for real-time event pushes are configured in **Settings → Organisation**.",
    actions: [{ label: 'API Keys', href: '/settings/api-keys' }],
  },
  {
    patterns: ['two factor', '2fa', 'authenticator', 'mfa', 'two-factor', 'security code'],
    text: "Enable **two-factor authentication** in **Settings → Security**. Scan the QR code with Google Authenticator or Authy, enter the 6-digit code to confirm, and from then on every login requires your password plus the code.",
    actions: [{ label: 'Security Settings', href: '/settings/security' }],
  },
  {
    patterns: ['password', 'change password', 'reset password', 'forgot password', 'update password'],
    text: "Change your password in **Settings → Security → Change Password**. If you've forgotten it, use the **Forgot Password** link on the login page — we'll email a reset link valid for 1 hour.",
    actions: [{ label: 'Security Settings', href: '/settings/security' }],
  },
  {
    patterns: ['profile', 'avatar', 'bio', 'my account', 'account settings', 'edit profile', 'job title'],
    text: "Update your name, bio, avatar, job title, and social links in **Settings → Profile**. You can also set your timezone and preferred language there.",
    actions: [{ label: 'My Profile', href: '/settings/profile' }],
  },
  {
    patterns: ['organisation', 'organization', 'company settings', 'domain', 'sso', 'branding', 'org settings'],
    text: "Organisation-level settings (name, domain, branding, SSO, data retention, webhooks) are under **Settings → Organisation**. Only Admins and Super Admins can access these.",
    actions: [{ label: 'Organisation', href: '/settings/organization' }],
  },
  {
    patterns: ['analytics', 'stats', 'usage report', 'storage report', 'usage breakdown'],
    text: "**Admin → Analytics** shows storage usage by workspace and file type, upload volume over the past 30 days, and active user counts. Use it to track trends and plan capacity.",
    actions: [{ label: 'Analytics', href: '/admin/analytics' }],
  },
  {
    patterns: ['permission', 'role', 'access control', 'restrict access', 'who can', 'manage user', 'user role'],
    text: "User permissions are set per-workspace and per-connector. In **Admin → User Management**, click **Permissions** on any user to assign their workspace role (Viewer / Editor / Admin) and connector access level (None / Read / Read+Write / Full).",
    actions: [{ label: 'User Management', href: '/admin/users' }],
  },
  {
    patterns: ['task', 'to-do', 'todo', 'checklist', 'action item', 'assign task'],
    text: "The **Tasks** page lets you create, assign, and track action items alongside your files. Set due dates, link tasks to workspaces, and mark them complete as your team progresses.",
    actions: [{ label: 'Tasks', href: '/tasks' }],
  },
  {
    patterns: ['social', 'feed', 'post update', 'comment', 'like post', 'team post'],
    text: "The **Social** feed is where your team shares updates, links, and commentary. Post updates, react to posts, and thread discussions — all alongside your file work.",
    actions: [{ label: 'Social Feed', href: '/social' }],
  },
  {
    patterns: ['storage', 'quota', 'storage full', 'running out of space', 'how much space', 'storage limit'],
    text: "Your current storage usage is shown in the **sidebar progress bar**. Permanently deleting files from the Recycle Bin frees space immediately. To increase your quota, upgrade your plan.",
    actions: [{ label: 'Billing & Plans', href: '/settings/billing' }, { label: 'Recycle Bin', href: '/recycle-bin' }],
  },
  {
    patterns: ['get started', 'how to use', 'guide', 'tutorial', 'new here', 'what can you do', 'help me', 'beginner'],
    text: "Here's a quick roadmap: 1) **Upload files** from the Files page. 2) **Create a workspace** to organise by project or team. 3) **Connect data sources** via Connectors. 4) **Invite teammates** from Admin → User Management. 5) **Search** anything from the top bar. What do you want to start with?",
    actions: [
      { label: 'Files', href: '/files' },
      { label: 'Workspaces', href: '/workspaces' },
      { label: 'Connectors', href: '/connectors' },
    ],
  },
  {
    patterns: ['thank', 'thanks', 'thx', 'bye', 'goodbye', "that's all", 'done', 'that helps', 'perfect'],
    text: "You're welcome! Feel free to ask anytime — I'm always here. Have a great day!",
  },
];

const FALLBACKS = [
  "I'm not sure about that one. Try asking about files, workspaces, connectors, messaging, billing, or security. What are you trying to do?",
  "Hmm, that's a bit outside my current knowledge. I'm best at helping with platform features — give me a topic like files, sharing, connectors, or billing and I'll point you in the right direction.",
  "I didn't quite get that. You can ask me things like \"how do I share a file?\", \"set up a connector\", or \"upgrade my plan\". What do you need?",
];

const SUGGESTIONS = [
  'How do I upload files?',
  'Set up a connector',
  'Invite a team member',
  'Upgrade my plan',
  'Enable two-factor auth',
  'How does search work?',
];

function matchRule(input: string) {
  const q = input.toLowerCase().trim();
  for (const rule of RULES) {
    for (const p of rule.patterns) {
      if (typeof p === 'string' ? q.includes(p) : p.test(q)) return rule;
    }
  }
  return null;
}

// ── Bot avatar ───────────────────────────────────────────────────────────────
function BotAvatar({ size = 'sm' }: { size?: 'xs' | 'sm' }) {
  const sz = size === 'xs' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSz = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className={cn('rounded-full bg-brand-red flex items-center justify-center flex-shrink-0', sz)}>
      <SparklesIcon className={cn('text-white', iconSz)} />
    </div>
  );
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-2">
      <BotAvatar size="xs" />
      <div className="flex gap-1 items-center px-3 py-2.5 bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border rounded-2xl rounded-tl-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-gray-dark animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-gray-dark animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-gray-dark animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────────
export function ChatWidget() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  useEffect(() => {
    if (!open) return;
    if (msgs.length === 0) {
      const firstName = user?.name?.split(' ')[0] ?? 'there';
      setMsgs([{
        id: 'welcome',
        role: 'bot',
        text: `Hi **${firstName}**! I'm **Lamid AI**, your smart assistant. Ask me anything about files, workspaces, connectors, messaging, billing, or security — I'm here to help.`,
      }]);
    }
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || typing) return;

    setMsgs((m) => [...m, { id: `u-${Date.now()}`, role: 'user', text: q }]);
    setInput('');
    setTyping(true);

    const delay = 650 + Math.random() * 700;
    await new Promise((r) => setTimeout(r, delay));

    const rule = matchRule(q);
    setTyping(false);
    setMsgs((m) => [...m, {
      id: `b-${Date.now()}`,
      role: 'bot',
      text: rule?.text ?? FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)],
      actions: rule?.actions,
    }]);
  };

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Ping ring — shows only when closed */}
        {!open && (
          <span className="absolute inset-0 rounded-full bg-brand-red animate-chat-ping pointer-events-none" />
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
          className={cn(
            'relative w-14 h-14 rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-brand-red-light via-brand-red to-brand-red-dark',
            'transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2',
            !open && 'animate-chat-flicker'
          )}
        >
          {open ? (
            /* X when open */
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* File + sparkle icon when closed */
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {/* Document page */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
                d="M9 12h6m-6 4h4m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              {/* Small sparkle star overlay */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4}
                d="M19 2l.4 1.2 1.2.4-1.2.4L19 5.2l-.4-1.2-1.2-.4 1.2-.4L19 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* ── Chat panel ─────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] flex flex-col rounded-2xl border border-brand-gray dark:border-dark-border bg-white dark:bg-dark-surface-1 shadow-modal animate-chat-open overflow-hidden"
          style={{ maxHeight: 'min(560px, calc(100vh - 8rem))' }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-black dark:bg-dark-surface-2 border-b border-black/20 flex-shrink-0">
            <BotAvatar size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none mb-1">Lamid AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <p className="text-[10px] text-white/55 font-medium">Always online</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
            {msgs.map((msg) => (
              <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                {msg.role === 'bot' && <BotAvatar size="xs" />}
                <div className={cn('flex flex-col max-w-[82%]', msg.role === 'user' && 'items-end')}>
                  <div className={cn(
                    'px-3 py-2.5 text-xs leading-relaxed',
                    msg.role === 'bot'
                      ? 'bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border text-brand-black dark:text-dark-text rounded-2xl rounded-tl-sm'
                      : 'bg-brand-red text-white rounded-2xl rounded-tr-sm'
                  )}>
                    <Bold text={msg.text} />
                  </div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 pl-0.5">
                      {msg.actions.map((a) => (
                        <Link
                          key={a.href}
                          href={a.href}
                          onClick={() => setOpen(false)}
                          className="text-[10px] font-semibold text-brand-red border border-brand-red/30 bg-brand-red/5 hover:bg-brand-red hover:text-white hover:border-brand-red px-2.5 py-1 rounded-lg transition-all duration-150"
                        >
                          {a.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && <TypingDots />}

            {/* Quick suggestions — only on first open */}
            {msgs.length <= 1 && !typing && (
              <div className="pt-1">
                <p className="text-[10px] font-semibold text-brand-gray-dark dark:text-dark-text-muted uppercase tracking-wider mb-2">Suggested</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-brand-white-soft dark:bg-dark-surface-2 border border-brand-gray dark:border-dark-border text-brand-gray-dark dark:text-dark-text-muted hover:border-brand-red hover:text-brand-red dark:hover:text-brand-red transition-all duration-150"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Powered-by strip */}
          <div className="px-4 pt-0 pb-1 flex-shrink-0">
            <p className="text-[9px] text-center text-brand-gray-dark dark:text-dark-text-muted tracking-wide">
              Powered by <span className="font-semibold text-brand-black dark:text-dark-text">Lamid AI</span>
            </p>
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-1.5 border-t border-brand-gray dark:border-dark-border flex items-center gap-2 flex-shrink-0 bg-white dark:bg-dark-surface-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); send(input); } }}
              placeholder="Ask me anything…"
              className="flex-1 h-9 px-3.5 rounded-xl border border-brand-gray dark:border-dark-border bg-brand-white-soft dark:bg-dark-surface-2 text-xs text-brand-black dark:text-dark-text placeholder:text-brand-gray-dark dark:placeholder:text-dark-text-muted focus:outline-none focus:border-brand-red transition-colors"
            />
            <button
              type="button"
              onClick={() => send(input)}
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="w-9 h-9 rounded-xl bg-brand-red hover:bg-brand-red-dark disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
