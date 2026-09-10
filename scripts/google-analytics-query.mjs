import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load .env variables
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(rootDir, 'google-credentials.json');
// The GA4 Property ID (can be extracted or set in .env)
const PROPERTY_ID = process.env.GA4_PROPERTY_ID || '552970561';

console.log('\n📊 ====================================================');
console.log('   WokChords — Google Analytics 4 (GA4) API Connector');
console.log('====================================================\n');

if (!fs.existsSync(KEY_FILE)) {
  console.log('⚠️  No Google Service Account key found at:');
  console.log(`    ${KEY_FILE}\n`);
  console.log('📋 How to connect to Google Analytics Data API:');
  console.log('1. Open Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Enable "Google Analytics Data API" (APIs & Services → Library)');
  console.log('3. Use the same service account JSON key ("google-credentials.json") in this project root');
  console.log('4. Copy the service account email (e.g. name@project.iam.gserviceaccount.com)');
  console.log('5. Go to Google Analytics (Admin → Property Access Management → click "+" → Add users)');
  console.log('6. Paste the email with "Viewer" role');
  console.log('7. Find your numeric Property ID (Admin → Property Settings → Property Details)');
  console.log('   and add it to .env as: GA4_PROPERTY_ID=123456789\n');
  process.exit(0);
}

if (!PROPERTY_ID) {
  console.log('⚠️  Please provide your numeric GA4 Property ID in .env:');
  console.log('    GA4_PROPERTY_ID=123456789');
  console.log('    (Found in Google Analytics → Admin → Property Settings → Property Details)\n');
  process.exit(0);
}

async function run() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const analyticsdata = google.analyticsdata({ version: 'v1beta', auth });

    console.log(`📡 Connected to GA4 Property: properties/${PROPERTY_ID}\n`);

    // 1. Real-time Active Users
    console.log('⚡ Real-time Active Visitors (Last 30 mins)...');
    const rtRes = await analyticsdata.properties.runRealtimeReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        metrics: [{ name: 'activeUsers' }],
      },
    });

    const activeUsers = rtRes.data.rows?.[0]?.metricValues?.[0]?.value || '0';
    console.log(`   👥 Current Active Musicians: ${activeUsers}\n`);

    // 2. Top Songs (Last 7 Days)
    console.log('🎵 Top Viewed Song Sheets (Last 7 Days)...');
    const reportRes = await analyticsdata.properties.runReport({
      property: `properties/${PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pageTitle' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
        limit: 10,
      },
    });

    const rows = reportRes.data.rows || [];
    if (rows.length === 0) {
      console.log('   ℹ️  No pageview data accumulated for this period yet.');
    } else {
      console.log('\n' + '-'.repeat(70));
      console.log('Page Title'.padEnd(45) + 'Pageviews'.padStart(12) + 'Users'.padStart(12));
      console.log('-'.repeat(70));
      for (const r of rows) {
        const title = (r.dimensionValues?.[0]?.value || '').slice(0, 43).padEnd(45);
        const pvs = (r.metricValues?.[0]?.value || '0').padStart(12);
        const users = (r.metricValues?.[1]?.value || '0').padStart(12);
        console.log(`${title}${pvs}${users}`);
      }
      console.log('-'.repeat(70) + '\n');
    }
  } catch (err) {
    console.error('❌ Error querying Google Analytics API:', err.message);
  }
}

run();
