import { ConnectorType } from '@hybridshare/shared/types/connector';
import type { BaseConnector } from './base.connector';
export declare function createConnector(type: ConnectorType): BaseConnector;
export declare function getConnectorInstance(connectorId: string): BaseConnector | undefined;
export declare function setConnectorInstance(connectorId: string, instance: BaseConnector): void;
export declare function removeConnectorInstance(connectorId: string): void;
export declare function listRegisteredTypes(): ConnectorType[];
export declare const CONNECTOR_METADATA: Record<ConnectorType, {
    name: string;
    category: string;
    icon: string;
    description: string;
    authType: 'oauth2' | 'credentials' | 'apikey' | 'none';
}>;
//# sourceMappingURL=connector.registry.d.ts.map