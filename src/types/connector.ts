export type ConnectorType =
  | 'GOOGLE_DRIVE' | 'DROPBOX' | 'ONEDRIVE' | 'BOX' | 'S3' | 'SFTP'
  | 'POSTGRES' | 'MYSQL' | 'MONGODB' | 'SQLITE' | 'MSSQL' | 'REDIS'
  | 'HUBSPOT' | 'SALESFORCE' | 'NOTION' | 'AIRTABLE' | 'GOOGLE_SHEETS'
  | 'REST_API' | 'GRAPHQL' | 'WEBHOOK';

export type ConnectorCategory = 'CLOUD' | 'DATABASE' | 'CRM' | 'CUSTOM';
export type ConnectorStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
export type ConnectorSyncMode = 'MANUAL' | 'SCHEDULED' | 'LIVE';

export interface ConnectorSetupField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select' | 'boolean';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
}

export interface ConnectorMeta {
  type: ConnectorType;
  category: ConnectorCategory;
  label: string;
  description: string;
  icon: string;
  color: string;
  fields: ConnectorSetupField[];
  supportsLive: boolean;
  supportsScheduled: boolean;
}
