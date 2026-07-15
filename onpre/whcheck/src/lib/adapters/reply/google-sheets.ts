import { google } from "googleapis";
import type { ReplyAdapter, ReplyPayload } from "./interface";

// GOOGLE_SERVICE_ACCOUNT_JSON env: stringified service account JSON
function getAuth() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not set");
  const creds = JSON.parse(json);
  return new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export class GoogleSheetsAdapter implements ReplyAdapter {
  constructor(private sheetId: string, private sheetName: string = "응답결과") {}

  async send(payload: ReplyPayload): Promise<void> {
    const auth = getAuth();
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: `${this.sheetName}!A:G`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          payload.respondedAt,
          payload.token.slice(0, 8) + "...",
          payload.status,
          payload.originalAddress,
          payload.newAddress ?? "",
          payload.consentAt,
        ]],
      },
    });
  }
}
