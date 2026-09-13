const { readFileSync, writeFileSync } = require('node:fs');
const { randomBytes } = require('node:crypto');
const { resolve } = require('node:path');
const path = resolve(__dirname, '../apps/api/.env');
let content = readFileSync(path, 'utf8');
const match = content.match(/^JWT_ACCESS_SECRET=(.*)$/m);
if (!match || match[1].startsWith('replace-')) {
  const line = 'JWT_ACCESS_SECRET=' + randomBytes(48).toString('base64url');
  content = match ? content.replace(/^JWT_ACCESS_SECRET=.*$/m, line) : content + '\n' + line + '\n';
  writeFileSync(path, content);
  console.log('Local JWT secret configured. Existing non-placeholder secrets are preserved.');
} else {
  console.log('Existing JWT secret preserved.');
}
