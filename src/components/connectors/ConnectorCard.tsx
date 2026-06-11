'use client';

import { useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Connector } from '@/shared/connector';
import { useConnectorStore } from '@/store/connector.store';
import { StatusBadge, Badge } from '../ui/Badge';
import { Dropdown } from '../ui/Dropdown';
import { useToast } from '../ui/Toast';

interface ConnectorCardProps {
  connector: Connector;
}

const categoryIcons: Record<string, React.ReactNode> = {
  CLOUD: (
    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  ),
  DATABASE: (
    <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  CRM: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  CUSTOM: (
    <svg className="w-5 h-5 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
};

const fallbackIcon = (
  <svg className="w-5 h-5 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

export function ConnectorCard({ connector }: ConnectorCardProps) {
  const { syncConnector, deleteConnector, testConnector, isSyncing } = useConnectorStore();
  const { success, error } = useToast();
  const [isTesting, setIsTesting] = useState(false);

  const handleSync = async () => {
    try {
      await syncConnector(connector.id);
      success(`${connector.name} sync started`);
    } catch {
      error('Sync failed');
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testConnector(connector.id);
      if (result.healthy) {
        success('Connection healthy');
      } else {
        error(`Connection failed: ${result.message}`);
      }
    } catch {
      error('Test failed');
    } finally {
      setIsTesting(false);
    }
  };

  const syncing = isSyncing[connector.id];

  const syncModeLabel = {
    MANUAL: 'Manual',
    SCHEDULED: connector.syncInterval ? `Every ${connector.syncInterval}m` : 'Scheduled',
    LIVE: 'Live sync',
  };

  return (
    <div className={cn(
      'card group flex flex-col gap-4 p-5 transition-all duration-200',
      'hover:shadow-card-hover hover:-translate-y-0.5',
      !connector.isEnabled && 'opacity-60'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-white-soft rounded-lg flex items-center justify-center flex-shrink-0 border border-brand-gray group-hover:border-brand-gray-dark transition-colors duration-150">
            {categoryIcons[connector.category] ?? fallbackIcon}
          </div>
          <div>
            <p className="text-sm font-bold text-brand-black">{connector.name}</p>
            <p className="text-[10px] text-brand-gray-dark font-medium mt-0.5">
              {connector.type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <Dropdown
          trigger={
            <button aria-label="More options" className="icon-btn w-7 h-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          }
          items={[
            {
              id: 'test',
              label: 'Test connection',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
              onClick: handleTest,
            },
            {
              id: 'sync',
              label: 'Sync now',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
              onClick: handleSync,
            },
            {
              id: 'delete',
              label: 'Remove',
              icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
              onClick: () => deleteConnector(connector.id),
              danger: true,
              divider: true,
            },
          ]}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <StatusBadge status={syncing ? 'SYNCING' : connector.status} />
        <Badge variant="default" size="sm">{syncModeLabel[connector.syncMode]}</Badge>
      </div>

      {/* Error */}
      {connector.errorMessage && (
        <div className="bg-brand-red-muted rounded-lg px-3 py-2">
          <p className="text-[10px] text-brand-red font-medium">{connector.errorMessage}</p>
        </div>
      )}

      {/* Last sync */}
      <div className="pt-1 border-t border-brand-gray flex items-center justify-between">
        <span className="text-[10px] text-brand-gray-dark">
          {connector.lastSyncAt ? `Synced ${formatRelativeTime(connector.lastSyncAt)}` : 'Never synced'}
        </span>

        <button
          onClick={handleSync}
          disabled={syncing || !connector.isEnabled}
          className={cn(
            'flex items-center gap-1 text-[10px] font-semibold transition-colors duration-150',
            syncing ? 'text-brand-gray-dark' : 'text-brand-red hover:text-brand-red-dark'
          )}
          title="Sync now"
        >
          <svg
            className={cn('w-3 h-3', syncing && 'animate-spin')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>
    </div>
  );
}
