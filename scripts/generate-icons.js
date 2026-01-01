// Script to generate PWA icons
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

// SVG icon template
const createSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#22d1c6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#a29bfe;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <text x="256" y="340" font-size="240" font-weight="bold" text-anchor="middle" fill="white" font-family="Arial, sans-serif">⭐</text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

// Create SVG files that can be used as icons
const sizes = [192, 512];

sizes.forEach(size => {
  const svg = createSvg(size);
  const filename = `icon-${size}.svg`;
  fs.writeFileSync(path.join(publicDir, filename), svg);
  console.log(`Created ${filename}`);
});

console.log('Icons generated! Note: For production, convert SVG to PNG using a tool like sharp or online converter.');
