import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const KEY_FILE = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(rootDir, 'google-credentials.json');
const SITE_URL = 'https://wokchords.wokdens.com/';

console.log('\n🔍 ====================================================');
console.log('   WokChords — Google Search Console API Connector');
console.log('====================================================\n');

if (!fs.existsSync(KEY_FILE)) {
  console.log('⚠️  No Google Service Account key found at:');
  console.log(`    ${KEY_FILE}\n`);
  console.log('📋 How to connect to Google Search Console API:');
  console.log('1. Open Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create a project (e.g. "WokChords Analytics")');
  console.log('3. Enable "Google Search Console API" (APIs & Services → Library)');
  console.log('4. Create a Service Account (IAM & Admin → Service Accounts → Create Service Account)');
  console.log('5. Under the created service account, click "Keys" → "Add Key" → "Create new key (JSON)"');
  console.log('6. Save the downloaded file as "google-credentials.json" in this project root');
  console.log('7. Copy the service account email (e.g. name@project.iam.gserviceaccount.com)');
  console.log('8. Go to Google Search Console (Settings → Users and permissions → Add User) and paste the email with "Owner" or "Full" permission.');
  console.log('\nRun this script again once saved, and it will fetch live search performance data!\n');
  process.exit(0);
}

async function run() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_FILE,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly', 'https://www.googleapis.com/auth/webmasters'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });

    console.log(`📡 Connected to Google Search Console API for: ${SITE_URL}\n`);

    // 1. Submit Sitemaps
    console.log('🗺️  Checking & Submitting Sitemaps...');
    const sitemapsToSubmit = [
      'https://wokchords.wokdens.com/sitemap-index.xml',
      'https://wokchords.wokdens.com/sitemap.xml',
    ];

    for (const sm of sitemapsToSubmit) {
      try {
        await searchconsole.sitemaps.submit({
          siteUrl: SITE_URL,
          feedpath: sm,
        });
        console.log(`   ✅ Submitted: ${sm}`);
      } catch (e) {
        console.log(`   ℹ️  ${sm}: ${e.message}`);
      }
    }

    console.log('\n📊 Fetching Top Search Queries (Last 28 Days)...');
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const res = await searchconsole.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 15,
      },
    });

    const rows = res.data.rows || [];
    if (rows.length === 0) {
      console.log('   ℹ️  No search query data returned for this period yet.');
    } else {
      console.log('\n' + '-'.repeat(75));
      console.log(
        'Query'.padEnd(40) +
        'Clicks'.padStart(8) +
        'Impressions'.padStart(14) +
        'CTR'.padStart(8) +
        'Position'.padStart(10)
      );
      console.log('-'.repeat(75));

      for (const r of rows) {
        const query = (r.keys?.[0] || '').slice(0, 38).padEnd(40);
        const clicks = String(r.clicks || 0).padStart(8);
        const imps = String(r.impressions || 0).padStart(14);
        const ctr = `${((r.ctr || 0) * 100).toFixed(1)}%`.padStart(8);
        const pos = (r.position || 0).toFixed(1).padStart(10);
        console.log(`${query}${clicks}${imps}${ctr}${pos}`);
      }
      console.log('-'.repeat(75) + '\n');
    }
  } catch (err) {
    console.error('❌ Error querying Google Search Console API:', err.message);
  }
}

run();
