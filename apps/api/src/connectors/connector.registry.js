"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONNECTOR_METADATA = void 0;
exports.createConnector = createConnector;
exports.getConnectorInstance = getConnectorInstance;
exports.setConnectorInstance = setConnectorInstance;
exports.removeConnectorInstance = removeConnectorInstance;
exports.listRegisteredTypes = listRegisteredTypes;
const connector_1 = require("@hybridshare/shared/types/connector");
const googledrive_connector_1 = require("./cloud/googledrive.connector");
const dropbox_connector_1 = require("./cloud/dropbox.connector");
const s3_connector_1 = require("./cloud/s3.connector");
const sftp_connector_1 = require("./cloud/sftp.connector");
const postgres_connector_1 = require("./database/postgres.connector");
const airtable_connector_1 = require("./crm/airtable.connector");
const rest_connector_1 = require("./custom/rest.connector");
const registry = new Map([
    [connector_1.ConnectorType.GOOGLE_DRIVE, () => new googledrive_connector_1.GoogleDriveConnector()],
    [connector_1.ConnectorType.DROPBOX, () => new dropbox_connector_1.DropboxConnector()],
    [connector_1.ConnectorType.S3, () => new s3_connector_1.S3Connector()],
    [connector_1.ConnectorType.SFTP, () => new sftp_connector_1.SftpConnector()],
    [connector_1.ConnectorType.POSTGRES, () => new postgres_connector_1.PostgresConnector()],
    [connector_1.ConnectorType.AIRTABLE, () => new airtable_connector_1.AirtableConnector()],
    [connector_1.ConnectorType.REST_API, () => new rest_connector_1.RestApiConnector()],
]);
const activeInstances = new Map();
function createConnector(type) {
    const factory = registry.get(type);
    if (!factory) {
        throw new Error(`Connector type '${type}' is not registered`);
    }
    return factory();
}
function getConnectorInstance(connectorId) {
    return activeInstances.get(connectorId);
}
function setConnectorInstance(connectorId, instance) {
    activeInstances.set(connectorId, instance);
}
function removeConnectorInstance(connectorId) {
    const instance = activeInstances.get(connectorId);
    if (instance) {
        instance.disconnect().catch(() => { });
        activeInstances.delete(connectorId);
    }
}
function listRegisteredTypes() {
    return Array.from(registry.keys());
}
exports.CONNECTOR_METADATA = {
    [connector_1.ConnectorType.GOOGLE_DRIVE]: {
        name: 'Google Drive',
        category: 'Cloud Storage',
        icon: 'google-drive',
        description: 'Connect to Google Drive files and folders',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.DROPBOX]: {
        name: 'Dropbox',
        category: 'Cloud Storage',
        icon: 'dropbox',
        description: 'Access and sync Dropbox files',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.ONEDRIVE]: {
        name: 'OneDrive',
        category: 'Cloud Storage',
        icon: 'onedrive',
        description: 'Connect to Microsoft OneDrive',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.BOX]: {
        name: 'Box',
        category: 'Cloud Storage',
        icon: 'box',
        description: 'Access Box cloud storage',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.S3]: {
        name: 'Amazon S3 / MinIO',
        category: 'Cloud Storage',
        icon: 's3',
        description: 'Connect to S3-compatible object storage',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.SFTP]: {
        name: 'SFTP',
        category: 'Cloud Storage',
        icon: 'sftp',
        description: 'SSH File Transfer Protocol server',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.POSTGRES]: {
        name: 'PostgreSQL',
        category: 'Database',
        icon: 'postgres',
        description: 'Connect to PostgreSQL databases',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.MYSQL]: {
        name: 'MySQL',
        category: 'Database',
        icon: 'mysql',
        description: 'Connect to MySQL / MariaDB databases',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.MONGODB]: {
        name: 'MongoDB',
        category: 'Database',
        icon: 'mongodb',
        description: 'Connect to MongoDB collections',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.SQLITE]: {
        name: 'SQLite',
        category: 'Database',
        icon: 'sqlite',
        description: 'Browse SQLite database files',
        authType: 'none',
    },
    [connector_1.ConnectorType.MSSQL]: {
        name: 'SQL Server',
        category: 'Database',
        icon: 'mssql',
        description: 'Connect to Microsoft SQL Server',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.REDIS_DB]: {
        name: 'Redis',
        category: 'Database',
        icon: 'redis',
        description: 'Browse and query Redis data',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.HUBSPOT]: {
        name: 'HubSpot',
        category: 'CRM',
        icon: 'hubspot',
        description: 'Access HubSpot CRM records and assets',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.ZOHO]: {
        name: 'Zoho CRM',
        category: 'CRM',
        icon: 'zoho',
        description: 'Connect to Zoho CRM data',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.SALESFORCE]: {
        name: 'Salesforce',
        category: 'CRM',
        icon: 'salesforce',
        description: 'Access Salesforce records and files',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.NOTION]: {
        name: 'Notion',
        category: 'CRM',
        icon: 'notion',
        description: 'Browse Notion databases and pages',
        authType: 'apikey',
    },
    [connector_1.ConnectorType.AIRTABLE]: {
        name: 'Airtable',
        category: 'CRM',
        icon: 'airtable',
        description: 'Connect to Airtable bases and tables',
        authType: 'apikey',
    },
    [connector_1.ConnectorType.GOOGLE_SHEETS]: {
        name: 'Google Sheets',
        category: 'CRM',
        icon: 'google-sheets',
        description: 'Read and write Google Sheets spreadsheets',
        authType: 'oauth2',
    },
    [connector_1.ConnectorType.REST_API]: {
        name: 'REST API',
        category: 'Custom',
        icon: 'api',
        description: 'Connect to any REST API endpoint',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.GRAPHQL]: {
        name: 'GraphQL',
        category: 'Custom',
        icon: 'graphql',
        description: 'Query any GraphQL API',
        authType: 'credentials',
    },
    [connector_1.ConnectorType.WEBHOOK]: {
        name: 'Webhook',
        category: 'Custom',
        icon: 'webhook',
        description: 'Receive data via webhooks',
        authType: 'none',
    },
    [connector_1.ConnectorType.CSV]: {
        name: 'CSV / Spreadsheet',
        category: 'Custom',
        icon: 'csv',
        description: 'Import and process CSV files',
        authType: 'none',
    },
};
//# sourceMappingURL=connector.registry.js.map