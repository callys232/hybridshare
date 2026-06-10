export * from './auth';
export * from './files';
export * from './workspaces';
export * from './connectors';
export * from './notifications';
export * from './analytics';
export * from './social';
export * from './organization';
export * from './payments';
export * from './admin';

export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true' || process.env.NODE_ENV === 'development';
}
