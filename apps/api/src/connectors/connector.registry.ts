import { ConnectorType } from '@hybridshare/shared/types/connector';
import type { BaseConnector } from './base.connector';
import { GoogleDriveConnector } from './cloud/googledrive.connector';
import { DropboxConnector } from './cloud/dropbox.connector';
import { S3Connector } from './cloud/s3.connector';
import { SftpConnector } from './cloud/sftp.connector';
import { PostgresConnector } from './database/postgres.connector';
import { AirtableConnector } from './crm/airtable.connector';
import { RestApiConnector } from './custom/rest.connector';

type ConnectorFactory = () => BaseConnector;

const registry = new Map<ConnectorType, ConnectorFactory>([
  [ConnectorType.GOOGLE_DRIVE, () => new GoogleDriveConnector()],
  [ConnectorType.DROPBOX, () => new DropboxConnector()],
  [ConnectorType.S3, () => new S3Connector()],
  [ConnectorType.SFTP, () => new SftpConnector()],
  [ConnectorType.POSTGRES, () => new PostgresConnector()],
  [ConnectorType.AIRTABLE, () => new AirtableConnector()],
  [ConnectorType.REST_API, () => new RestApiConnector()],
]);

const activeInstances = new Map<string, BaseConnector>();

export function createConnector(type: ConnectorType): BaseConnector {
  const factory = registry.get(type);
  if (!factory) {
    throw new Error(`Connector type '${type}' is not registered`);
  }
  return factory();
}

export function getConnectorInstance(connectorId: string): BaseConnector | undefined {
  return activeInstances.get(connectorId);
}

export function setConnectorInstance(connectorId: string, instance: BaseConnector): void {
  activeInstances.set(connectorId, instance);
}

export function removeConnectorInstance(connectorId: string): void {
  const instance = activeInstances.get(connectorId);
  if (instance) {
    instance.disconnect().catch(() => {});
    activeInstances.delete(connectorId);
  }
}

export function listRegisteredTypes(): ConnectorType[] {
  return Array.from(registry.keys());
}

export const CONNECTOR_METADATA: Record<ConnectorType, {
  name: string;
  category: string;
  icon: string;
  description: string;
  authType: 'oauth2' | 'credentials' | 'apikey' | 'none';
}> = {
  [ConnectorType.GOOGLE_DRIVE]: {
    name: 'Google Drive',
    category: 'Cloud Storage',
    icon: 'google-drive',
    description: 'Connect to Google Drive files and folders',
    authType: 'oauth2',
  },
  [ConnectorType.DROPBOX]: {
    name: 'Dropbox',
    category: 'Cloud Storage',
    icon: 'dropbox',
    description: 'Access and sync Dropbox files',
    authType: 'oauth2',
  },
  [ConnectorType.ONEDRIVE]: {
    name: 'OneDrive',
    category: 'Cloud Storage',
    icon: 'onedrive',
    description: 'Connect to Microsoft OneDrive',
    authType: 'oauth2',
  },
  [ConnectorType.BOX]: {
    name: 'Box',
    category: 'Cloud Storage',
    icon: 'box',
    description: 'Access Box cloud storage',
    authType: 'oauth2',
  },
  [ConnectorType.S3]: {
    name: 'Amazon S3 / MinIO',
    category: 'Cloud Storage',
    icon: 's3',
    description: 'Connect to S3-compatible object storage',
    authType: 'credentials',
  },
  [ConnectorType.SFTP]: {
    name: 'SFTP',
    category: 'Cloud Storage',
    icon: 'sftp',
    description: 'SSH File Transfer Protocol server',
    authType: 'credentials',
  },
  [ConnectorType.POSTGRES]: {
    name: 'PostgreSQL',
    category: 'Database',
    icon: 'postgres',
    description: 'Connect to PostgreSQL databases',
    authType: 'credentials',
  },
  [ConnectorType.MYSQL]: {
    name: 'MySQL',
    category: 'Database',
    icon: 'mysql',
    description: 'Connect to MySQL / MariaDB databases',
    authType: 'credentials',
  },
  [ConnectorType.MONGODB]: {
    name: 'MongoDB',
    category: 'Database',
    icon: 'mongodb',
    description: 'Connect to MongoDB collections',
    authType: 'credentials',
  },
  [ConnectorType.SQLITE]: {
    name: 'SQLite',
    category: 'Database',
    icon: 'sqlite',
    description: 'Browse SQLite database files',
    authType: 'none',
  },
  [ConnectorType.MSSQL]: {
    name: 'SQL Server',
    category: 'Database',
    icon: 'mssql',
    description: 'Connect to Microsoft SQL Server',
    authType: 'credentials',
  },
  [ConnectorType.REDIS_DB]: {
    name: 'Redis',
    category: 'Database',
    icon: 'redis',
    description: 'Browse and query Redis data',
    authType: 'credentials',
  },
  [ConnectorType.HUBSPOT]: {
    name: 'HubSpot',
    category: 'CRM',
    icon: 'hubspot',
    description: 'Access HubSpot CRM records and assets',
    authType: 'oauth2',
  },
  [ConnectorType.ZOHO]: {
    name: 'Zoho CRM',
    category: 'CRM',
    icon: 'zoho',
    description: 'Connect to Zoho CRM data',
    authType: 'oauth2',
  },
  [ConnectorType.SALESFORCE]: {
    name: 'Salesforce',
    category: 'CRM',
    icon: 'salesforce',
    description: 'Access Salesforce records and files',
    authType: 'oauth2',
  },
  [ConnectorType.NOTION]: {
    name: 'Notion',
    category: 'CRM',
    icon: 'notion',
    description: 'Browse Notion databases and pages',
    authType: 'apikey',
  },
  [ConnectorType.AIRTABLE]: {
    name: 'Airtable',
    category: 'CRM',
    icon: 'airtable',
    description: 'Connect to Airtable bases and tables',
    authType: 'apikey',
  },
  [ConnectorType.GOOGLE_SHEETS]: {
    name: 'Google Sheets',
    category: 'CRM',
    icon: 'google-sheets',
    description: 'Read and write Google Sheets spreadsheets',
    authType: 'oauth2',
  },
  [ConnectorType.REST_API]: {
    name: 'REST API',
    category: 'Custom',
    icon: 'api',
    description: 'Connect to any REST API endpoint',
    authType: 'credentials',
  },
  [ConnectorType.GRAPHQL]: {
    name: 'GraphQL',
    category: 'Custom',
    icon: 'graphql',
    description: 'Query any GraphQL API',
    authType: 'credentials',
  },
  [ConnectorType.WEBHOOK]: {
    name: 'Webhook',
    category: 'Custom',
    icon: 'webhook',
    description: 'Receive data via webhooks',
    authType: 'none',
  },
  [ConnectorType.CSV]: {
    name: 'CSV / Spreadsheet',
    category: 'Custom',
    icon: 'csv',
    description: 'Import and process CSV files',
    authType: 'none',
  },
};
