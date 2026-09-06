const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

async function addDomain(domain) {
  console.log(`Adding custom domain ${domain} to project wokchords...`);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/wokchords/domains`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: domain }),
  });
  const data = await res.json();
  console.log('Result:', JSON.stringify(data, null, 2));
}

addDomain('wokchords.wokdens.com').catch(console.error);
