"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsConnector = void 0;
const googleapis_1 = require("googleapis");
const base_connector_1 = require("../base.connector");
const connector_1 = require("@hybridshare/shared/types/connector");
class GoogleSheetsConnector extends base_connector_1.BaseConnector {
    id = 'google-sheets';
    name = 'Google Sheets';
    type = connector_1.ConnectorType.GOOGLE_SHEETS;
    category = connector_1.ConnectorCategory.CRM;
    sheets = null;
    async connect(credentials) {
        const { accessToken, refreshToken, clientId, clientSecret } = credentials;
        const auth = new googleapis_1.google.auth.OAuth2(clientId, clientSecret);
        auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
        this.sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        this.credentials = credentials;
        this.isConnected = true;
    }
    async disconnect() {
        this.sheets = null;
        this.isConnected = false;
    }
    async testConnection() {
        const start = Date.now();
        try {
            await googleapis_1.google.drive({ version: 'v3', auth: this.sheets?._options?.auth })
                .files.list({ q: "mimeType='application/vnd.google-apps.spreadsheet'", pageSize: 1 });
            return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
        }
        catch (err) {
            return { healthy: false, latencyMs: Date.now() - start, message: err.message, checkedAt: new Date() };
        }
    }
    async listAssets(spreadsheetId, _options = {}) {
        if (!this.sheets)
            throw new Error('Not connected');
        if (!spreadsheetId) {
            const drive = googleapis_1.google.drive({ version: 'v3', auth: this.sheets?._options?.auth });
            const response = await drive.files.list({
                q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
                fields: 'files(id,name,modifiedTime,webViewLink)',
                pageSize: 50,
            });
            return (response.data.files ?? []).map((f) => this.buildNormalizedAsset({
                id: f.id,
                name: f.name,
                type: 'spreadsheet',
                path: f.id,
                url: f.webViewLink ?? null,
                updatedAt: this.normalizeDate(f.modifiedTime),
            }));
        }
        const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
        return (meta.data.sheets ?? []).map((sheet) => this.buildNormalizedAsset({
            id: `${spreadsheetId}/${sheet.properties.sheetId}`,
            name: sheet.properties.title ?? `Sheet${sheet.properties.sheetId}`,
            type: 'sheet',
            path: `${spreadsheetId}/${sheet.properties.sheetId}`,
            metadata: { spreadsheetId, sheetId: sheet.properties.sheetId, rowCount: sheet.properties.gridProperties?.rowCount },
        }));
    }
    async getAsset(assetId) {
        if (!this.sheets)
            throw new Error('Not connected');
        const [spreadsheetId] = assetId.split('/');
        const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
        return this.buildNormalizedAsset({
            id: assetId,
            name: meta.data.properties.title ?? spreadsheetId,
            type: 'spreadsheet',
            path: spreadsheetId,
            url: meta.data.spreadsheetUrl ?? null,
        });
    }
    async searchAssets(query) {
        const all = await this.listAssets();
        return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
    }
    async fetchContent(assetId) {
        if (!this.sheets)
            throw new Error('Not connected');
        const [spreadsheetId, sheetName] = assetId.split('/');
        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetName ?? 'Sheet1',
        });
        const values = response.data.values ?? [];
        const headers = values[0] ?? [];
        const rows = values.slice(1).map((row) => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
            return obj;
        });
        return Buffer.from(JSON.stringify(rows, null, 2));
    }
    async pushContent(assetId, content) {
        if (!this.sheets)
            throw new Error('Not connected');
        const [spreadsheetId, sheetName] = assetId.split('/');
        const records = JSON.parse(content.toString());
        if (!records.length)
            return;
        const headers = Object.keys(records[0]);
        const values = [headers, ...records.map((r) => headers.map((h) => r[h] ?? ''))];
        await this.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName ?? 'Sheet1'}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values },
        });
    }
    async deleteAsset(assetId) {
        if (!this.sheets)
            throw new Error('Not connected');
        const [spreadsheetId, sheetIdStr] = assetId.split('/');
        if (sheetIdStr) {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: [{ deleteSheet: { sheetId: parseInt(sheetIdStr) } }] },
            });
        }
    }
    async getChanges(_since) {
        return [];
    }
}
exports.GoogleSheetsConnector = GoogleSheetsConnector;
//# sourceMappingURL=sheets.connector.js.map