// Cloudflare Pages Deployment & Verification Script
import fs from 'node:fs';
import path from 'node:path';

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;

async function main() {
  console.log('1. Verifying API Token & Account ID...');
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects`, {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  console.log('Projects in account:', JSON.stringify(data, null, 2));

  // Check if project 'wokchords' exists
  let project = data.result?.find((p) => p.name === 'wokchords');
  if (!project) {
    console.log('2. Creating Cloudflare Pages project: wokchords...');
    const createRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'wokchords',
        production_branch: 'main',
      }),
    });
    const createData = await createRes.json();
    console.log('Create result:', JSON.stringify(createData, null, 2));
  } else {
    console.log('Project "wokchords" already exists!');
  }
}

main().catch(console.error);
