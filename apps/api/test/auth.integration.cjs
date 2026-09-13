// Runs against the local development database, creates unique test users, and removes only those users.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { once } = require('node:events');
const { Pool } = require('pg');
require('dotenv').config({ quiet: true });
const { hashPassword, verifyPassword } = require('../dist/auth/password');
const { JwtService } = require('@nestjs/jwt');
const base = 'http://127.0.0.1:3002/api';
const origin = 'http://localhost:5175';
const ids = [];
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const server = spawn(process.execPath, ['dist/main.js'], {
  cwd: process.cwd(), env: { ...process.env, PORT: '3002', API_ORIGIN: 'http://127.0.0.1:3002', FRONTEND_ORIGIN: origin },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', c => { logs += c; });
server.stderr.on('data', c => { logs += c; });
async function request(path, options = {}) {
  const { body, cookie, token, origin: source = origin, custom = true, ...rest } = options;
  const response = await fetch(base + path, {
    ...rest, headers: { 'Content-Type': 'application/json', Origin: source,
      ...(custom ? { 'X-Mood-Garden': '1' } : {}),
      ...(cookie ? { Cookie: cookie } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, cookie: response.headers.get('set-cookie') };
}
(async () => {
  try {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (server.exitCode !== null) throw new Error('Test API failed: ' + logs);
      try { if ((await request('/health/ready')).status === 200) { ready = true; break; } } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    assert(ready, 'Test API readiness');
    const hash = await hashPassword('long-test-password');
    assert(await verifyPassword('long-test-password', hash));
    assert.equal(await verifyPassword('wrong-password', hash), false);
    assert.equal(await verifyPassword('test', 'bad-hash'), false);
    assert.notEqual(hash, await hashPassword('long-test-password'));
    assert.equal((await request('/users/me')).status, 401);
    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const account = { email: 'test_' + suffix + '@example.invalid', username: 'test_' + suffix, password: 'Valid-test-password!42' };
    assert.equal((await request('/auth/register', { method: 'POST', body: { ...account, password: 'short' } })).status, 400);
    assert.equal((await request('/auth/register', { method: 'POST', body: account, origin: 'https://evil.example' })).status, 403);
    assert.equal((await request('/auth/register', { method: 'POST', body: account, custom: false })).status, 403);
    const registered = await request('/auth/register', { method: 'POST', body: { ...account, email: account.email.toUpperCase() } });
    assert.equal(registered.status, 201);
    ids.push(registered.body.user.id);
    assert.equal(registered.body.user.email, account.email);
    assert(!('passwordHash' in registered.body.user));
    assert(!('refreshToken' in registered.body));
    assert.match(registered.cookie, /HttpOnly/);
    assert.match(registered.cookie, /SameSite=Lax/);
    assert.match(registered.cookie, /Path=\/api\/auth/);
    const firstCookie = registered.cookie.split(';')[0];
    const firstAccess = registered.body.accessToken;
    assert.equal((await request('/auth/register', { method: 'POST', body: account })).status, 409);
    assert.equal((await request('/auth/login', { method: 'POST', body: { email: account.email, password: 'wrong-password' } })).status, 401);
    const me = await request('/users/me', { token: firstAccess });
    assert.equal(me.body.id, ids[0]);
    const rows = await pool.query('SELECT password_hash FROM users WHERE id=$1', [ids[0]]);
    assert.notEqual(rows.rows[0].password_hash, account.password);
    for (const table of ['gardens', 'mood_streaks', 'user_preferences']) {
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM ' + table + ' WHERE user_id=$1', [ids[0]])).rows[0].n, 1);
    }
    assert.equal((await request('/users/me', { method: 'PATCH', token: firstAccess, body: { passwordHash: 'hacked' } })).status, 400);
    assert.equal((await request('/users/me/preferences', { method: 'PATCH', token: firstAccess, body: { timezone: 'invalid/zone' } })).status, 400);
    assert.equal((await request('/users/me/preferences', { method: 'PATCH', token: firstAccess, body: { city: null } })).status, 400);
    assert.equal((await request('/users/me/preferences', { method: 'PATCH', token: firstAccess, body: { temperatureTolerance: 11 } })).status, 400);
    assert.equal((await request('/users/me/preferences', { method: 'PATCH', token: firstAccess, body: { city: 'Hanoi', preferredStyle: 'MINIMAL', timezone: 'Asia/Ho_Chi_Minh', temperatureTolerance: 1.5 } })).status, 200);
    assert.equal((await request('/users/me/preferences', { token: firstAccess })).body.city, 'Hanoi');
    assert.equal((await request('/users/me', { method: 'PATCH', token: firstAccess, body: { username: 'updated_' + suffix } })).status, 200);
    const jwt = new JwtService({ secret: process.env.JWT_ACCESS_SECRET });
    const payload = jwt.decode(firstAccess);
    const expired = jwt.sign({ sub: payload.sub, sid: payload.sid }, { expiresIn: -1, issuer: 'mood-garden', audience: 'mood-garden-web' });
    assert.equal((await request('/users/me', { token: expired })).status, 401);
    assert.equal((await request('/users/me', { token: firstAccess + 'bad' })).status, 401);
    const rotations = await Promise.all([1, 2].map(() => request('/auth/refresh', { method: 'POST', cookie: firstCookie })));
    assert.deepEqual(rotations.map(r => r.status).sort(), [200, 401]);
    const refreshed = rotations.find(r => r.status === 200);
    const nextCookie = refreshed.cookie.split(';')[0];
    assert.notEqual(nextCookie, firstCookie);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: firstCookie })).status, 401);
    const second = await request('/auth/register', { method: 'POST', body: { ...account, email: 'second_' + account.email, username: 'second_' + suffix } });
    assert.equal(second.status, 201); ids.push(second.body.user.id);
    assert.equal((await request('/users/me/preferences', { token: second.body.accessToken })).body.city, 'Ho Chi Minh City');
    const loggedOut = await request('/auth/logout', { method: 'POST', cookie: nextCookie });
    assert.equal(loggedOut.status, 204);
    assert.match(loggedOut.cookie, /Expires=Thu, 01 Jan 1970/);
    assert.equal((await request('/users/me', { token: refreshed.body.accessToken })).status, 401);
    assert.equal((await request('/users/me', { token: firstAccess })).status, 401);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: nextCookie })).status, 401);
    const login = await request('/auth/login', { method: 'POST', body: { email: account.email, password: account.password } });
    assert.equal(login.status, 200);
    assert.equal((await request('/users/me', { token: login.body.accessToken })).status, 200);
    let rateLimited = false;
    for (let i = 0; i < 12; i++) {
      if ((await request('/auth/login', { method: 'POST', body: { email: account.email, password: 'wrong-password' } })).status === 429) { rateLimited = true; break; }
    }
    assert(rateLimited, 'Login is rate limited');
    console.log('PASS: password hashing, registration, defaults, validation, user isolation, JWT expiry/tampering, atomic refresh, replay rejection, logout revocation, login and rate limiting.');
  } finally {
    for (const id of ids) await pool.query('DELETE FROM users WHERE id=$1', [id]);
    await pool.end();
    server.kill();
    if (server.exitCode === null) await once(server, 'exit');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

