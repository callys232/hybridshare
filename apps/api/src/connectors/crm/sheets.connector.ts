import { google, sheets_v4 } from 'googleapis';
import { BaseConnector } from '../base.connector';
import {
  ConnectorType, ConnectorCategory, HealthStatus, NormalizedAsset, AssetChange, ListOptions,
} from '@hybridshare/shared/types/connector';

export class GoogleSheetsConnector extends BaseConnector {
  readonly id = 'google-sheets';
  readonly name = 'Google Sheets';
  readonly type = ConnectorType.GOOGLE_SHEETS;
  readonly category = ConnectorCategory.CRM;

  private sheets: sheets_v4.Sheets | null = null;

  async connect(credentials: Record<string, unknown>): Promise<void> {
    const { accessToken, refreshToken, clientId, clientSecret } = credentials as {
      accessToken: string; refreshToken: string; clientId?: string; clientSecret?: string;
    };
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    this.sheets = google.sheets({ version: 'v4', auth });
    this.credentials = credentials;
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    this.sheets = null;
    this.isConnected = false;
  }

  async testConnection(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await google.drive({ version: 'v3', auth: (this.sheets as sheets_v4.Sheets)?._options?.auth as never })
        .files.list({ q: "mimeType='application/vnd.google-apps.spreadsheet'", pageSize: 1 });
      return { healthy: true, latencyMs: Date.now() - start, message: 'Connected', checkedAt: new Date() };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message, checkedAt: new Date() };
    }
  }

  async listAssets(spreadsheetId?: string, _options: ListOptions = {}): Promise<NormalizedAsset[]> {
    if (!this.sheets) throw new Error('Not connected');

    if (!spreadsheetId) {
      const drive = google.drive({ version: 'v3', auth: (this.sheets as sheets_v4.Sheets)?._options?.auth as never });
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
        fields: 'files(id,name,modifiedTime,webViewLink)',
        pageSize: 50,
      });
      return (response.data.files ?? []).map((f) =>
        this.buildNormalizedAsset({
          id: f.id!,
          name: f.name!,
          type: 'spreadsheet',
          path: f.id!,
          url: f.webViewLink ?? null,
          updatedAt: this.normalizeDate(f.modifiedTime),
        })
      );
    }

    const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
    return (meta.data.sheets ?? []).map((sheet) =>
      this.buildNormalizedAsset({
        id: `${spreadsheetId}/${sheet.properties!.sheetId}`,
        name: sheet.properties!.title ?? `Sheet${sheet.properties!.sheetId}`,
        type: 'sheet',
        path: `${spreadsheetId}/${sheet.properties!.sheetId}`,
        metadata: { spreadsheetId, sheetId: sheet.properties!.sheetId, rowCount: sheet.properties!.gridProperties?.rowCount },
      })
    );
  }

  async getAsset(assetId: string): Promise<NormalizedAsset> {
    if (!this.sheets) throw new Error('Not connected');
    const [spreadsheetId] = assetId.split('/');
    const meta = await this.sheets.spreadsheets.get({ spreadsheetId });
    return this.buildNormalizedAsset({
      id: assetId,
      name: meta.data.properties!.title ?? spreadsheetId,
      type: 'spreadsheet',
      path: spreadsheetId,
      url: meta.data.spreadsheetUrl ?? null,
    });
  }

  async searchAssets(query: string): Promise<NormalizedAsset[]> {
    const all = await this.listAssets();
    return all.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  }

  async fetchContent(assetId: string): Promise<Buffer> {
    if (!this.sheets) throw new Error('Not connected');
    const [spreadsheetId, sheetName] = assetId.split('/');
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetName ?? 'Sheet1',
    });
    const values = response.data.values ?? [];
    const headers = values[0] ?? [];
    const rows = values.slice(1).map((row) => {
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
      return obj;
    });
    return Buffer.from(JSON.stringify(rows, null, 2));
  }

  async pushContent(assetId: string, content: Buffer): Promise<void> {
    if (!this.sheets) throw new Error('Not connected');
    const [spreadsheetId, sheetName] = assetId.split('/');
    const records = JSON.parse(content.toString()) as Record<string, unknown>[];
    if (!records.length) return;
    const headers = Object.keys(records[0]);
    const values = [headers, ...records.map((r) => headers.map((h) => r[h] ?? ''))];
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName ?? 'Sheet1'}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values },
    });
  }

  async deleteAsset(assetId: string): Promise<void> {
    if (!this.sheets) throw new Error('Not connected');
    const [spreadsheetId, sheetIdStr] = assetId.split('/');
    if (sheetIdStr) {
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ deleteSheet: { sheetId: parseInt(sheetIdStr) } }] },
      });
    }
  }

  async getChanges(_since: Date): Promise<AssetChange[]> {
    return [];
  }
}
