export const CONNECTOR_METADATA: Record<string, {
  name: string;
  category: string;
  description: string;
  authType: 'oauth2' | 'credentials' | 'apikey' | 'none';
}> = {
  GOOGLE_DRIVE: { name: 'Google Drive', category: 'CLOUD', description: 'Connect to Google Drive files', authType: 'oauth2' },
  DROPBOX: { name: 'Dropbox', category: 'CLOUD', description: 'Access Dropbox files', authType: 'oauth2' },
  ONEDRIVE: { name: 'OneDrive', category: 'CLOUD', description: 'Connect to Microsoft OneDrive', authType: 'oauth2' },
  BOX: { name: 'Box', category: 'CLOUD', description: 'Access Box cloud storage', authType: 'oauth2' },
  S3: { name: 'Amazon S3', category: 'CLOUD', description: 'S3-compatible object storage', authType: 'credentials' },
  SFTP: { name: 'SFTP', category: 'CLOUD', description: 'SSH File Transfer Protocol', authType: 'credentials' },
  POSTGRES: { name: 'PostgreSQL', category: 'DATABASE', description: 'PostgreSQL databases', authType: 'credentials' },
  MYSQL: { name: 'MySQL', category: 'DATABASE', description: 'MySQL / MariaDB databases', authType: 'credentials' },
  MONGODB: { name: 'MongoDB', category: 'DATABASE', description: 'MongoDB collections', authType: 'credentials' },
  SQLITE: { name: 'SQLite', category: 'DATABASE', description: 'SQLite database files', authType: 'none' },
  MSSQL: { name: 'SQL Server', category: 'DATABASE', description: 'Microsoft SQL Server', authType: 'credentials' },
  REDIS_DB: { name: 'Redis', category: 'DATABASE', description: 'Browse and query Redis', authType: 'credentials' },
  HUBSPOT: { name: 'HubSpot', category: 'CRM', description: 'HubSpot CRM records', authType: 'oauth2' },
  ZOHO: { name: 'Zoho CRM', category: 'CRM', description: 'Zoho CRM data', authType: 'oauth2' },
  SALESFORCE: { name: 'Salesforce', category: 'CRM', description: 'Salesforce records', authType: 'oauth2' },
  NOTION: { name: 'Notion', category: 'CRM', description: 'Notion databases and pages', authType: 'apikey' },
  AIRTABLE: { name: 'Airtable', category: 'CRM', description: 'Airtable bases and tables', authType: 'apikey' },
  GOOGLE_SHEETS: { name: 'Google Sheets', category: 'CRM', description: 'Google Sheets spreadsheets', authType: 'oauth2' },
  REST_API: { name: 'REST API', category: 'CUSTOM', description: 'Any REST API endpoint', authType: 'credentials' },
  GRAPHQL: { name: 'GraphQL', category: 'CUSTOM', description: 'GraphQL API', authType: 'credentials' },
  WEBHOOK: { name: 'Webhook', category: 'CUSTOM', description: 'Receive data via webhooks', authType: 'none' },
  CSV: { name: 'CSV / Spreadsheet', category: 'CUSTOM', description: 'Import CSV files', authType: 'none' },
};
