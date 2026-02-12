const { google } = require('googleapis');
const fs = require('fs');

const key = JSON.parse(fs.readFileSync('nia-encoding-firebase-adminsdk-fbsvc-8d7528082e.json'));

const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function test() {
  const sheetId = process.env.GOOGLE_SHEET_ID || process.argv[2];
  
  if (!sheetId) {
    console.log('usage: node test-sheets.js YOUR_SHEET_ID');
    console.log('or set GOOGLE_SHEET_ID in .env.local');
    return;
  }

  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });
    console.log('✓ connection successful!');
    console.log('sheet title:', res.data.properties.title);
    console.log('service account:', key.client_email);
    console.log('\nmake sure you shared the sheet with this email!');
  } catch (err) {
    console.error('✗ test failed:', err.message);
    console.log('\ntroubleshooting:');
    console.log('1. enable google sheets api in cloud console');
    console.log('2. share your sheet with:', key.client_email);
    console.log('3. check sheet id is correct');
  }
}

test();
