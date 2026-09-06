const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b0f17"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <linearGradient id="glowOrange" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ea580c" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="glowCyan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06b6d4" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Ambient Glow Orbs -->
  <circle cx="150" cy="120" r="320" fill="url(#glowOrange)"/>
  <circle cx="1050" cy="500" r="340" fill="url(#glowCyan)"/>

  <!-- Subtle Border Frame -->
  <rect x="30" y="30" width="1140" height="570" rx="32" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>

  <!-- Top Badge: 100% Ad-Free -->
  <g transform="translate(80, 85)">
    <rect width="210" height="42" rx="21" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" stroke-width="1.5"/>
    <circle cx="24" cy="21" r="6" fill="#10b981"/>
    <text x="40" y="27" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="800" fill="#34d399" letter-spacing="1">100% AD-FREE</text>
  </g>

  <!-- Top Right Attribution -->
  <g transform="translate(940, 85)">
    <rect width="180" height="42" rx="21" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.1)" stroke-width="1"/>
    <text x="90" y="26" text-anchor="middle" font-family="monospace, sans-serif" font-size="14" font-weight="700" fill="#94a3b8">wokdens.com</text>
  </g>

  <!-- Main Brand Heading -->
  <g transform="translate(80, 230)">
    <text x="0" y="0" font-family="Inter, -apple-system, sans-serif" font-size="76" font-weight="900" fill="#ffffff" letter-spacing="-2">
      🎸 Wok<tspan fill="url(#textGrad)">Chords</tspan>
    </text>
    <text x="0" y="65" font-family="Inter, -apple-system, sans-serif" font-size="34" font-weight="700" fill="#cbd5e1" letter-spacing="-0.5">
      The Ultimate Chords &amp; Lyrics Platform
    </text>
    <text x="0" y="115" font-family="Inter, -apple-system, sans-serif" font-size="22" font-weight="500" fill="#64748b">
      Accurate chord sheets for Guitar, Ukulele &amp; Piano with real-time transpose, capo &amp; auto-scroll.
    </text>
  </g>

  <!-- Feature Pills Footer -->
  <g transform="translate(80, 490)">
    <!-- Pill 1 -->
    <rect x="0" y="0" width="220" height="48" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="110" y="30" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">⚡ Instant Key Transpose</text>

    <!-- Pill 2 -->
    <rect x="236" y="0" width="190" height="48" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="331" y="30" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">🎯 Capo Calculator</text>

    <!-- Pill 3 -->
    <rect x="442" y="0" width="200" height="48" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="542" y="30" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">📜 Hands-Free Scroll</text>

    <!-- Pill 4 -->
    <rect x="658" y="0" width="210" height="48" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <text x="763" y="30" text-anchor="middle" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#e2e8f0">❤️ Practice Setlists</text>
  </g>

  <!-- URL watermark -->
  <text x="1120" y="522" text-anchor="end" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#f97316">wokchords.wokdens.com</text>
</svg>
`;

async function run() {
  const outputPath = path.join(__dirname, '..', 'public', 'og-image.png');
  const buffer = Buffer.from(svg);
  await sharp(buffer)
    .png({ quality: 95 })
    .toFile(outputPath);
  console.log('Successfully generated:', outputPath);
}

run().catch(console.error);
