export function validateEnv(env: Record<string, unknown>) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  for (const name of ['DATABASE_URL', 'FRONTEND_ORIGIN', 'WEATHER_API_KEY']) {
    if (typeof env[name] !== 'string' || !env[name]) throw new Error(name + ' is required');
  }
  const database = new URL(String(env.DATABASE_URL));
  if (!['postgres:', 'postgresql:'].includes(database.protocol)) throw new Error('DATABASE_URL must use PostgreSQL');
  const origin = new URL(String(env.FRONTEND_ORIGIN));
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== env.FRONTEND_ORIGIN) {
    throw new Error('FRONTEND_ORIGIN must be an HTTP(S) origin without a trailing slash');
  }
  if (typeof env.JWT_ACCESS_SECRET !== 'string' || env.JWT_ACCESS_SECRET.length < 32 || env.JWT_ACCESS_SECRET.startsWith('replace-')) {
    throw new Error('JWT_ACCESS_SECRET must be a unique random secret of at least 32 characters');
  }
  const apiOrigin = String(env.API_ORIGIN ?? 'http://localhost:' + port);
  if (new URL(apiOrigin).origin !== apiOrigin) throw new Error('API_ORIGIN must be a valid origin');
  return { ...env, PORT: port, API_ORIGIN: apiOrigin };
}
