import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

let app: admin.app.App | undefined;

export const getFirebaseAdmin = () => {
  if (app !== undefined) {
    return app;
  }

  const keyPath = path.join(process.cwd(), 'firebase-service-account.json');
  
  let credential;
  
  if (fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8')) as admin.ServiceAccount;
    credential = admin.credential.cert(serviceAccount);
  } else {
    const serviceAccount: admin.ServiceAccount = {
      clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL ?? '',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    };
    credential = admin.credential.cert(serviceAccount);
  }

  app = admin.initializeApp({
    credential,
  });

  return app;
};

export const verifyFirebaseUser = async (
  email: string
): Promise<{ email: string; uid: string } | null> => {
  try {
    const adminApp = getFirebaseAdmin();
    const user = await adminApp.auth().getUserByEmail(email);

    if (user) {
      return { email: user.email ?? email, uid: user.uid };
    }
    return null;
  } catch {
    return null;
  }
};
