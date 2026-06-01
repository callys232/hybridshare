import { prisma } from '../config/database';
import { encryptCredentials, decryptCredentials } from '../utils/crypto';
import type { EncryptedCredentials } from '@hybridshare/shared/types/connector';

export class CredentialService {
  async store(connectorId: string, credentials: Record<string, unknown>): Promise<void> {
    const plaintext = JSON.stringify(credentials);
    const { encryptedData, iv, tag } = encryptCredentials(plaintext);

    await prisma.connectorCredential.upsert({
      where: { connectorId },
      create: { connectorId, encryptedData, iv, tag },
      update: { encryptedData, iv, tag },
    });
  }

  async retrieve(connectorId: string): Promise<Record<string, unknown>> {
    const cred = await prisma.connectorCredential.findUnique({ where: { connectorId } });
    if (!cred) throw Object.assign(new Error('Credentials not found'), { statusCode: 404 });

    const plaintext = decryptCredentials(cred.encryptedData, cred.iv, cred.tag);
    return JSON.parse(plaintext) as Record<string, unknown>;
  }

  async delete(connectorId: string): Promise<void> {
    await prisma.connectorCredential.deleteMany({ where: { connectorId } });
  }

  async rotate(connectorId: string, newCredentials: Record<string, unknown>): Promise<void> {
    await this.store(connectorId, newCredentials);
  }

  getEncrypted(credentials: Record<string, unknown>): EncryptedCredentials {
    const plaintext = JSON.stringify(credentials);
    return encryptCredentials(plaintext);
  }

  decryptRaw(encrypted: EncryptedCredentials): Record<string, unknown> {
    const plaintext = decryptCredentials(encrypted.encryptedData, encrypted.iv, encrypted.tag);
    return JSON.parse(plaintext) as Record<string, unknown>;
  }
}

export const credentialService = new CredentialService();
