import fs from 'node:fs';
import path from 'node:path';

import { google } from 'googleapis';

const getAuth = () => {
  const keyPath = path.join(process.cwd(), 'firebase-service-account.json');
  
  let credentials: Record<string, unknown>;
  
  if (fs.existsSync(keyPath)) {
    credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8')) as Record<string, unknown>;
  } else {
    credentials = {
      client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL ?? '',
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
      type: 'service_account',
    };
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export const getSheets = () => {
  const auth = getAuth();
  return google.sheets({ auth, version: 'v4' });
};

export const writeToSheet = async (sheetId: string, range: string, values: unknown[][]) => {
  const sheets = getSheets();

  const response = await sheets.spreadsheets.values.update({
    range,
    requestBody: { values },
    spreadsheetId: sheetId,
    valueInputOption: 'USER_ENTERED',
  });

  return response.data;
};

export const batchWriteToSheet = async (
  sheetId: string,
  updates: { range: string; values: unknown[][] }[]
): Promise<void> => {
  if (updates.length === 0) return;

  const sheets = getSheets();

  const data = updates.map(({ range, values }) => ({
    range,
    values,
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
};

export const readFromSheet = async (sheetId: string, range: string) => {
  const sheets = getSheets();
  
  const response = await sheets.spreadsheets.values.get({
    range,
    spreadsheetId: sheetId,
  });

  return response.data.values ?? [];
};
