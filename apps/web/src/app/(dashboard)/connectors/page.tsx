'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useConnectorStore } from '@/store/connector.store';
import { NodesPattern } from '@/components/ui/BackgroundPattern';
import { ConnectorCard } from '@/components/connectors/ConnectorCard';
import { ConnectorSetup } from '@/components/connectors/ConnectorSetup';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { LockedButton } from '@/components/ui/PlanGate';
import { CONNECTOR_METADATA } from '@/lib/connector-metadata';

export default function ConnectorsPage() {
  const { connectors, fetchConnectors, isLoading } = useConnectorStore();
  const [showSetup, setShowSetup] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchConnectors();
  }, []);

  const categories = ['all', 'CLOUD', 'DATABASE', 'CRM', 'CUSTOM'];

  const filtered = connectors.filter((c) =>
    filterCategory === 'all' ? true : c.category === filterCategory
  );

  return (
    <div className="relative space-y-6 animate-fade-in">
      <NodesPattern opacity={0.5} />
      <div className="page-header">
        <div>
          <h1 className="page-title">Connectors</h1>
          <p className="text-sm text-brand-gray-dark mt-1">
            Connect to 23 external data sources and cloud platforms
          </p>
        </div>
        <LockedButton feature="connect_cloud" onClick={() => setShowSetup(true)}>
          <Button
            variant="primary"
            size="md"
            iconLeft={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Add Connector
          </Button>
        </LockedButton>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: connectors.length, color: 'text-brand-black' },
          { label: 'Connected', value: connectors.filter((c) => c.status === 'CONNECTED').length, color: 'text-emerald-600' },
          { label: 'Errors', value: connectors.filter((c) => c.status === 'ERROR').length, color: 'text-brand-red' },
          { label: 'Syncing', value: connectors.filter((c) => c.status === 'SYNCING').length, color: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="stat-card py-4">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-brand-gray-dark font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 capitalize',
              filterCategory === cat
                ? 'bg-brand-black text-white border-brand-black'
                : 'bg-white text-brand-gray-dark border-brand-gray hover:border-brand-black hover:text-brand-black'
            )}
          >
            {cat === 'all' ? 'All connectors' : cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" className="text-brand-gray-dark" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 bg-brand-white-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-brand-black mb-1">No connectors yet</p>
          <p className="text-xs text-brand-gray-dark mb-5">Add your first connector to get started.</p>
          <Button variant="primary" size="sm" onClick={() => setShowSetup(true)}>
            Add Connector
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((connector) => (
            <ConnectorCard key={connector.id} connector={connector} />
          ))}
        </div>
      )}

      {/* Available connector types */}
      <div className="card p-5">
        <h2 className="section-title mb-4">Available Integrations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {Object.values(CONNECTOR_METADATA).map((meta) => (
            <button
              key={meta.name}
              type="button"
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-brand-gray hover:border-brand-black hover:bg-brand-white-soft transition-all duration-150 group"
              onClick={() => setShowSetup(true)}
            >
              <div className="w-8 h-8 bg-brand-white-soft rounded-lg flex items-center justify-center group-hover:bg-brand-gray transition-colors duration-150">
                <svg className="w-4 h-4 text-brand-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold text-brand-black text-center leading-tight">{meta.name}</span>
              <span className="text-[9px] text-brand-gray-dark">{meta.category}</span>
            </button>
          ))}
        </div>
      </div>

      {showSetup && (
        <ConnectorSetup
          onClose={() => setShowSetup(false)}
          onSuccess={() => {
            setShowSetup(false);
            fetchConnectors();
          }}
        />
      )}
    </div>
  );
}
