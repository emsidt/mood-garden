const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env', quiet: true });

async function request(path, options = {}) {
  const response = await fetch('http://localhost:3000/api' + path, options);
  return { status: response.status, body: await response.json() };
}

async function main() {
  const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
  let userId;
  const database = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    const register = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5175', 'X-Mood-Garden': '1' },
      body: JSON.stringify({
        email: 'weather_test_' + suffix + '@example.invalid', username: 'weather_test_' + suffix,
        password: 'Weather-test-password!42',
      }),
    });
    if (register.status !== 201) throw new Error('Registration failed: HTTP ' + register.status);
    userId = register.body.user.id;
    const preferences = await request('/users/me/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + register.body.accessToken },
      body: JSON.stringify({ city: 'Hà Nội' }),
    });
    if (preferences.status !== 200) throw new Error('Preference update failed: HTTP ' + preferences.status);
    const weather = await request('/weather/current', { headers: { Authorization: 'Bearer ' + register.body.accessToken } });
    if (weather.status !== 200) throw new Error('Weather request failed: HTTP ' + weather.status);
    console.log('WEATHER_ENDPOINT_OK city=' + weather.body.city + ' temp_c=' + weather.body.temperature + ' condition=' + weather.body.condition);
  } finally {
    if (userId) {
      await database.connect();
      await database.query('DELETE FROM users WHERE id = $1', [userId]);
      await database.end();
    }
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
