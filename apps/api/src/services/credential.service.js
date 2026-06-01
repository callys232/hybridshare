"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentialService = exports.CredentialService = void 0;
const database_1 = require("../config/database");
const crypto_1 = require("../utils/crypto");
class CredentialService {
    async store(connectorId, credentials) {
        const plaintext = JSON.stringify(credentials);
        const { encryptedData, iv, tag } = (0, crypto_1.encryptCredentials)(plaintext);
        await database_1.prisma.connectorCredential.upsert({
            where: { connectorId },
            create: { connectorId, encryptedData, iv, tag },
            update: { encryptedData, iv, tag },
        });
    }
    async retrieve(connectorId) {
        const cred = await database_1.prisma.connectorCredential.findUnique({ where: { connectorId } });
        if (!cred)
            throw Object.assign(new Error('Credentials not found'), { statusCode: 404 });
        const plaintext = (0, crypto_1.decryptCredentials)(cred.encryptedData, cred.iv, cred.tag);
        return JSON.parse(plaintext);
    }
    async delete(connectorId) {
        await database_1.prisma.connectorCredential.deleteMany({ where: { connectorId } });
    }
    async rotate(connectorId, newCredentials) {
        await this.store(connectorId, newCredentials);
    }
    getEncrypted(credentials) {
        const plaintext = JSON.stringify(credentials);
        return (0, crypto_1.encryptCredentials)(plaintext);
    }
    decryptRaw(encrypted) {
        const plaintext = (0, crypto_1.decryptCredentials)(encrypted.encryptedData, encrypted.iv, encrypted.tag);
        return JSON.parse(plaintext);
    }
}
exports.CredentialService = CredentialService;
exports.credentialService = new CredentialService();
//# sourceMappingURL=credential.service.js.map