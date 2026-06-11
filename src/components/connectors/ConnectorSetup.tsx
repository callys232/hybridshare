'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useConnectorStore } from '@/store/connector.store';
import { CONNECTOR_METADATA } from '@/lib/connector-metadata';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface ConnectorSetupProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

export function ConnectorSetup({ onClose, onSuccess }: ConnectorSetupProps) {
  const { createConnector, testConnector } = useConnectorStore();
  const { success, error } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<string>('');
  const [connectorName, setConnectorName] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [syncMode, setSyncMode] = useState<'MANUAL' | 'SCHEDULED' | 'LIVE'>('MANUAL');
  const [syncInterval, setSyncInterval] = useState(60);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ healthy: boolean; message: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const selectedMeta = selectedType ? CONNECTOR_METADATA[selectedType] : null;

  const categoryGroups: Record<string, string[]> = {
    CLOUD: ['GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE', 'BOX', 'S3', 'SFTP'],
    DATABASE: ['POSTGRES', 'MYSQL', 'MONGODB', 'SQLITE', 'MSSQL', 'REDIS_DB'],
    CRM: ['HUBSPOT', 'ZOHO', 'SALESFORCE', 'NOTION', 'AIRTABLE', 'GOOGLE_SHEETS'],
    CUSTOM: ['REST_API', 'GRAPHQL', 'WEBHOOK', 'CSV'],
  };

  const credentialFields: Record<string, Array<{ key: string; label: string; type?: string; placeholder?: string }>> = {
    S3: [
      { key: 'accessKeyId', label: 'Access Key ID', placeholder: 'AKIA...' },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', placeholder: '...' },
      { key: 'region', label: 'Region', placeholder: 'us-east-1' },
      { key: 'bucket', label: 'Bucket Name', placeholder: 'my-bucket' },
      { key: 'endpoint', label: 'Custom Endpoint (optional)', placeholder: 'https://...' },
    ],
    SFTP: [
      { key: 'host', label: 'Host', placeholder: 'sftp.example.com' },
      { key: 'port', label: 'Port', placeholder: '22' },
      { key: 'username', label: 'Username', placeholder: 'user' },
      { key: 'password', label: 'Password', type: 'password', placeholder: '...' },
      { key: 'remotePath', label: 'Remote Path', placeholder: '/uploads' },
    ],
    POSTGRES: [
      { key: 'host', label: 'Host', placeholder: 'localhost' },
      { key: 'port', label: 'Port', placeholder: '5432' },
      { key: 'database', label: 'Database', placeholder: 'mydb' },
      { key: 'username', label: 'Username', placeholder: 'postgres' },
      { key: 'password', label: 'Password', type: 'password', placeholder: '...' },
    ],
    AIRTABLE: [
      { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'key...' },
      { key: 'baseId', label: 'Base ID', placeholder: 'app...' },
    ],
    NOTION: [
      { key: 'apiKey', label: 'Integration Token', type: 'password', placeholder: 'secret_...' },
      { key: 'databaseId', label: 'Database ID (optional)', placeholder: 'abc123...' },
    ],
    REST_API: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://api.example.com' },
      { key: 'authType', label: 'Auth Type (none/bearer/basic/apikey)', placeholder: 'bearer' },
      { key: 'token', label: 'Token (if applicable)', type: 'password', placeholder: '...' },
    ],
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const tempConnector = await createConnector({ name: `test-${Date.now()}`, type: selectedType as never }, credentials);
      const result = await testConnector(tempConnector.id);
      setTestResult(result);
    } catch {
      setTestResult({ healthy: false, message: 'Failed to create test connection' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await createConnector(
        {
          name: connectorName,
          type: selectedType as never,
          syncMode: syncMode as never,
          syncInterval: syncMode === 'SCHEDULED' ? syncInterval : null,
        },
        credentials
      );
      success(`${connectorName} connector added`);
      onSuccess();
    } catch {
      error('Failed to create connector');
    } finally {
      setIsCreating(false);
    }
  };

  const steps = [
    { n: 1, label: 'Type' },
    { n: 2, label: 'Credentials' },
    { n: 3, label: 'Sync' },
    { n: 4, label: 'Test' },
    { n: 5, label: 'Confirm' },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title="Add Connector"
      size="lg"
      footer={
        <div className="flex items-center gap-2 justify-between w-full">
          <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep((s) => (s - 1) as Step)} disabled={isCreating}>
            {step === 1 ? 'Cancel' : '← Back'}
          </Button>
          <div className="flex gap-2">
            {step < 5 && (
              <Button
                variant="primary"
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={
                  (step === 1 && !selectedType) ||
                  (step === 2 && !connectorName)
                }
              >
                Continue →
              </Button>
            )}
            {step === 5 && (
              <Button variant="danger" onClick={handleCreate} loading={isCreating}>
                Create Connector
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200',
                step === s.n ? 'bg-brand-black text-white scale-110' :
                step > s.n ? 'bg-brand-red text-white' :
                'bg-brand-gray text-brand-gray-dark'
              )}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className={cn(
                'text-[10px] font-medium ml-1.5 hidden sm:block',
                step === s.n ? 'text-brand-black' : 'text-brand-gray-dark'
              )}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors duration-200',
                  step > s.n ? 'bg-brand-red' : 'bg-brand-gray'
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Type */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-brand-black">Select a connector type</p>
            {Object.entries(categoryGroups).map(([category, types]) => (
              <div key={category}>
                <p className="text-[10px] font-semibold text-brand-gray-dark uppercase tracking-wider mb-2">{category}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {types.map((type) => {
                    const meta = CONNECTOR_METADATA[type];
                    if (!meta) return null;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedType(type);
                          setConnectorName(meta.name);
                        }}
                        className={cn(
                          'p-3 rounded-lg border text-left transition-all duration-150',
                          selectedType === type
                            ? 'border-brand-black bg-brand-black-soft text-white shadow-card-active'
                            : 'border-brand-gray hover:border-brand-black hover:bg-brand-white-soft'
                        )}
                      >
                        <p className={cn('text-xs font-semibold', selectedType === type ? 'text-white' : 'text-brand-black')}>
                          {meta.name}
                        </p>
                        <p className={cn('text-[10px] mt-0.5', selectedType === type ? 'text-white/70' : 'text-brand-gray-dark')}>
                          {meta.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2 — Credentials */}
        {step === 2 && selectedMeta && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-black mb-1.5">Connector Name</label>
              <input
                type="text"
                value={connectorName}
                onChange={(e) => setConnectorName(e.target.value)}
                className="input-field"
                placeholder={selectedMeta.name}
                autoFocus
              />
            </div>

            {selectedMeta.authType === 'oauth2' ? (
              <div className="bg-brand-white-soft rounded-lg p-4 border border-brand-gray text-center">
                <p className="text-sm text-brand-black font-medium mb-3">
                  Authorize {selectedMeta.name} via OAuth
                </p>
                <p className="text-xs text-brand-gray-dark mb-4">
                  You'll be redirected to {selectedMeta.name} to grant HybridShare access.
                </p>
                <Button variant="primary" size="sm">
                  Connect with {selectedMeta.name}
                </Button>
              </div>
            ) : (
              (credentialFields[selectedType] ?? []).map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-brand-black mb-1.5">{field.label}</label>
                  <input
                    type={field.type ?? 'text'}
                    value={credentials[field.key] ?? ''}
                    onChange={(e) => setCredentials((p) => ({ ...p, [field.key]: e.target.value }))}
                    className="input-field"
                    placeholder={field.placeholder}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 3 — Sync */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-brand-black">Configure sync mode</p>
            {(['MANUAL', 'SCHEDULED', 'LIVE'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSyncMode(mode)}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all duration-150',
                  syncMode === mode
                    ? 'border-brand-black bg-brand-white-soft'
                    : 'border-brand-gray hover:border-brand-gray-dark'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 transition-colors duration-150',
                  syncMode === mode ? 'border-brand-black bg-brand-black' : 'border-brand-gray'
                )}>
                  {syncMode === mode && <div className="w-1.5 h-1.5 bg-white rounded-full m-auto mt-0.5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-black">{mode.charAt(0) + mode.slice(1).toLowerCase()}</p>
                  <p className="text-xs text-brand-gray-dark mt-0.5">
                    {mode === 'MANUAL' && 'Trigger syncs manually from the dashboard'}
                    {mode === 'SCHEDULED' && 'Sync automatically on a schedule'}
                    {mode === 'LIVE' && 'Sync in real-time as changes happen'}
                  </p>
                </div>
              </button>
            ))}

            {syncMode === 'SCHEDULED' && (
              <div>
                <label className="block text-xs font-semibold text-brand-black mb-1.5">Sync interval (minutes)</label>
                <input
                  type="number"
                  value={syncInterval}
                  onChange={(e) => setSyncInterval(parseInt(e.target.value) || 60)}
                  className="input-field"
                  min={5}
                  max={10080}
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Test */}
        {step === 4 && (
          <div className="space-y-4 text-center">
            <p className="text-sm font-semibold text-brand-black">Test connection</p>
            <p className="text-xs text-brand-gray-dark">
              Verify that HybridShare can connect to {selectedMeta?.name} with your credentials.
            </p>

            {testResult ? (
              <div className={cn(
                'rounded-lg p-4 border',
                testResult.healthy ? 'bg-emerald-50 border-emerald-200' : 'bg-brand-red-muted border-brand-red/20'
              )}>
                <p className={cn('text-sm font-semibold', testResult.healthy ? 'text-emerald-700' : 'text-brand-red')}>
                  {testResult.healthy ? '✓ Connection successful' : '✗ Connection failed'}
                </p>
                <p className="text-xs mt-1 text-brand-gray-dark">{testResult.message}</p>
              </div>
            ) : (
              <Button
                variant="outline"
                size="md"
                onClick={handleTest}
                loading={isTesting}
              >
                Test Connection
              </Button>
            )}
          </div>
        )}

        {/* Step 5 — Confirm */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-brand-black">Review & confirm</p>
            <div className="card p-4 space-y-3">
              {[
                { label: 'Name', value: connectorName },
                { label: 'Type', value: selectedMeta?.name },
                { label: 'Category', value: selectedMeta?.category },
                { label: 'Sync Mode', value: syncMode },
                ...(syncMode === 'SCHEDULED' ? [{ label: 'Interval', value: `${syncInterval} minutes` }] : []),
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-brand-gray-dark">{item.label}</span>
                  <span className="text-xs font-semibold text-brand-black">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
