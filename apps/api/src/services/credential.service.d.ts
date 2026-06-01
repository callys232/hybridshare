import type { EncryptedCredentials } from '@hybridshare/shared/types/connector';
export declare class CredentialService {
    store(connectorId: string, credentials: Record<string, unknown>): Promise<void>;
    retrieve(connectorId: string): Promise<Record<string, unknown>>;
    delete(connectorId: string): Promise<void>;
    rotate(connectorId: string, newCredentials: Record<string, unknown>): Promise<void>;
    getEncrypted(credentials: Record<string, unknown>): EncryptedCredentials;
    decryptRaw(encrypted: EncryptedCredentials): Record<string, unknown>;
}
export declare const credentialService: CredentialService;
//# sourceMappingURL=credential.service.d.ts.map