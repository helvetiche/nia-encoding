import { getFirebaseAdmin } from './firebaseAdmin';

export interface Spreadsheet {
  id: string;
  name: string;
  description: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export const getSpreadsheets = async (): Promise<Spreadsheet[]> => {
  const admin = getFirebaseAdmin();
  const snapshot = await admin.firestore().collection('spreadsheets').orderBy('createdAt', 'desc').get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Spreadsheet));
};

export const getSpreadsheet = async (id: string): Promise<Spreadsheet | null> => {
  const admin = getFirebaseAdmin();
  const doc = await admin.firestore().collection('spreadsheets').doc(id).get();
  
  if (!doc.exists) {
    return null;
  }
  
  return {
    id: doc.id,
    ...doc.data(),
  } as Spreadsheet;
};

export const createSpreadsheet = async (data: Omit<Spreadsheet, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const admin = getFirebaseAdmin();
  const now = new Date().toISOString();
  
  const docRef = await admin.firestore().collection('spreadsheets').add({
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  return docRef.id;
};

export const updateSpreadsheet = async (id: string, data: Partial<Omit<Spreadsheet, 'id' | 'createdAt'>>): Promise<void> => {
  const admin = getFirebaseAdmin();
  const now = new Date().toISOString();
  
  await admin.firestore().collection('spreadsheets').doc(id).update({
    ...data,
    updatedAt: now,
  });
};

export const deleteSpreadsheet = async (id: string): Promise<void> => {
  const admin = getFirebaseAdmin();
  await admin.firestore().collection('spreadsheets').doc(id).delete();
};

export const extractSheetIdFromUrl = (url: string): string | null => {
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/.exec(url);
  return match ? match[1] : null;
};
