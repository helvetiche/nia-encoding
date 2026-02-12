const admin = require('firebase-admin');

const serviceAccount = {
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  client_email: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  type: 'service_account',
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function createUser() {
  const email = 'helvetiche@gmail.com';
  const password = 'Nasche2004';

  try {
    const userRecord = await admin.auth().createUser({
      email,
      emailVerified: true,
      password,
    });

    console.log('✓ user created successfully!');
    console.log('email:', userRecord.email);
    console.log('uid:', userRecord.uid);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('user already exists, updating password...');
      
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(user.uid, {
        password,
      });
      
      console.log('✓ password updated!');
      console.log('email:', email);
    } else {
      console.error('error:', error.message);
    }
  }

  process.exit(0);
}

createUser();
