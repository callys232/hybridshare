'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';

interface SettingsNavItem {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

interface SettingsSection {
  group: string;
  items: SettingsNavItem[];
}

const SETTINGS_NAV: SettingsSection[] = [
  {
    group: 'Account',
    items: [
      {
        href: '/settings/profile',
        label: 'Profile',
        description: 'Name, photo, bio',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ),
      },
      {
        href: '/settings/security',
        label: 'Security',
        description: 'Password, 2FA, sessions',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
      },
      {
        href: '/settings/preferences',
        label: 'Preferences',
        description: 'Theme, language, timezone',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Workspace',
    items: [
      {
        href: '/settings/notifications',
        label: 'Notifications',
        description: 'Alerts and email digests',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ),
      },
      {
        href: '/settings/organization',
        label: 'Organization',
        description: 'Branding, domains, SSO',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        href: '/settings/api-keys',
        label: 'API Keys',
        description: 'Developer access tokens',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'Billing',
    items: [
      {
        href: '/settings/billing',
        label: 'Billing & Plans',
        description: 'Subscription, invoices',
        icon: (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        ),
      },
    ],
  },
];

function NavItem({ item, isActive }: { item: SettingsNavItem; isActive: boolean }) {
  return (
    <Tooltip content={item.description} side="right" delay={600}>
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-brand-black text-white shadow-sm'
            : 'text-brand-gray-dark hover:text-brand-black hover:bg-brand-gray/50 dark:hover:bg-dark-surface-2 dark:hover:text-white'
        )}
      >
        <span className={cn(
          'flex-shrink-0 transition-colors duration-150',
          isActive ? 'text-white' : 'text-brand-gray-dark group-hover:text-brand-black dark:group-hover:text-white'
        )}>
          {item.icon}
        </span>
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge && (
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            isActive ? 'bg-white/20 text-white' : 'bg-brand-red text-white'
          )}>
            {item.badge}
          </span>
        )}
        {isActive && (
          <svg className="w-3.5 h-3.5 text-white/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </Link>
    </Tooltip>
  );
}

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0">
      {/* Back link */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-xs text-brand-gray-dark hover:text-brand-black dark:hover:text-white font-medium mb-5 transition-colors duration-150 group"
      >
        <svg className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to dashboard
      </Link>

      <div className="space-y-5">
        {SETTINGS_NAV.map((section) => (
          <div key={section.group}>
            <p className="px-3 text-[10px] font-semibold text-brand-gray-dark uppercase tracking-widest mb-1">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
