# Local development

## Implemented scope

- npm workspaces: `apps/web` (React + Vite) and `apps/api` (NestJS).
- Web: TypeScript, Tailwind CSS, React Router, TanStack Query, Axios.
- API: environment validation, global DTO validation, consistent errors, Helmet, CORS, Swagger.
- PostgreSQL 17 via Docker Compose; Prisma 7 with the PostgreSQL driver adapter.
- Authentication: registration, login, refresh rotation, logout, guarded current-user/profile/preferences endpoints.
- Web: login/register forms, protected routes, profile/preferences editing, session restoration and automatic access-token refresh.
- Mood, garden progression, wardrobe, weather integration, uploads and scoring remain subsequent phases.

## Requirements

Node.js 22.14+ (22 LTS recommended), npm 10+, Docker Desktop with Linux containers running.
Ports: 5175 (web), 3000 (API), 55432 (PostgreSQL; container port 5432).

## First run (PowerShell, repository root)

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
node scripts/setup-env.cjs
npm run db:up
npm run db:generate
npm run db:migrate -- --name init
npm run dev
```

Only copy environment examples on the first run; preserve existing local settings.
The Compose credentials are local development defaults. Use separate credentials and an appropriate origin in deployed environments.

- Web: http://localhost:5175
- Swagger: http://localhost:3000/api/docs
- Liveness: http://localhost:3000/api/health
- Database readiness: http://localhost:3000/api/health/ready

The API starts without connecting to the database; readiness returns 503 when PostgreSQL is unavailable.
The web development server proxies `/api` to port 3000. If changing the API port, update the Vite proxy too.
For deployment, set `VITE_API_URL` to the public backend URL including `/api`, set `FRONTEND_ORIGIN` and `API_ORIGIN` on the API, use HTTPS with `NODE_ENV=production`, and configure the frontend host to serve `index.html` for client routes. The refresh cookie uses SameSite=Lax: host the apps on the same site (for example app.example.com and api.example.com), or proxy the API through the frontend origin. Unrelated hosting domains require a separate cookie/CSRF design.
Weather and storage credentials will be introduced when their providers are implemented; no external provider is called by this foundation.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run both apps with watch mode |
| `npm run build` | Generate Prisma client and build both apps |
| `npm run typecheck` | Generate Prisma client and check both apps |
| `npm run db:validate` | Validate Prisma schema |
| `npm run db:migrate -- --name change_name` | Create/apply a development migration |
| `npm run db:studio` | Inspect database with Prisma Studio |
| `npm run db:down` | Stop PostgreSQL, preserving the named data volume |
| `npm run start -w @mood-garden/api` | Run the built API |
| `npm run preview -w @mood-garden/web` | Preview the web build locally |

Run production API commands from `apps/api` or inject the environment through the hosting platform.
Generated Prisma client and build outputs are ignored; commit schema changes, migrations, and the root package lock.

## Structure

```text
apps/
  api/
    prisma/schema.prisma
    prisma.config.ts
    src/
      auth/ users/ moods/ gardens/ wardrobe/ weather/ outfits/
      common/filters/
      config/
      health/
      prisma/
      app.module.ts
      main.ts
  web/
    src/
      lib/api.ts
      app.tsx
      main.tsx
      styles.css
compose.yaml
docs/development.md
```

## Database decisions

- UUID primary keys; snake_case table and column mappings.
- Mood uniqueness uses `(userId, entryDate)`, not the full timestamp. The mood service calculates `entryDate` from the user's IANA timezone, so a check-in is daily in the user's own locale.
- Refresh tokens are represented by hashes and expiry/revocation timestamps; token rotation and hashing will be implemented in Phase 2.
- Favorite state lives on an outfit recommendation; other reactions use the feedback enum.
- Wardrobe items referenced by outfit history cannot be hard deleted. The CRUD phase should archive them with `isActive = false`.
- Services must validate ownership, temperature ranges, and valid outfit combinations; the schema alone does not enforce these business rules.

## Next phase

The root package overrides pin patched transitive dependency ranges for Multer, DeepmergeTS, and MySQL2. Reassess these when upgrading NestJS and Prisma. Schema validation, client generation, migration, and build were checked with these overrides.

Setup references: [Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Vite](https://vite.dev/guide/), [Tailwind with Vite](https://tailwindcss.com/docs/installation/using-vite).

Implement wardrobe CRUD and weather-aware outfit recommendations.

## Weather

- Add `WEATHER_API_KEY` to `apps/api/.env`; it is validated at API start-up and is never exposed to the web app.
- `GET /api/weather/current` is authenticated and uses the city stored in the signed-in user's preferences.
- The backend requests WeatherAPI over HTTPS, normalizes its response to temperature, feels-like temperature, rain, wind, humidity, UV and a small condition enum, then caches results by city for 15 minutes in memory.
- Weather data is intentionally not saved as a `weather_snapshots` record yet. Snapshots will be created when an outfit recommendation is persisted.
- WeatherAPI's free plan requires provider attribution before public deployment. Add a visible attribution in the weather/outfit UI before release.

## Mood and garden

- `POST /api/moods` accepts a mood and optional note. It grants 25 XP exactly once per local calendar day.
- The same transaction writes the mood, updates the current/longest streak, and updates garden XP/level. A duplicate check-in returns HTTP 409 and grants nothing.
- `GET /api/moods/today`, `/history` and `/statistics` provide the check-in state and recent history.
- `GET /api/garden` returns XP progress, streaks, unlocked cosmetic plants and the next unlock. Levels follow `floor(sqrt(xp / 50)) + 1`; level 2 begins at 50 XP.
- The web app provides `/moods` for check-in and `/garden` for the live garden. A mood cannot be changed after it is saved for the day in this MVP.

## Authentication design and checks

- Passwords: salted scrypt (N=32768, r=8, p=1); 10–128 characters.
- Access JWTs: 15 minutes, HS256, issuer/audience verification. Stored only in frontend memory.
- Refresh tokens: 48 random bytes, SHA-256 hashes in PostgreSQL, 30-day absolute session lifetime. Rotation uses an atomic compare-and-swap. Old refresh tokens are rejected; session IDs stay stable until logout/expiry.
- HttpOnly refresh cookie scoped to /api/auth; Secure in production. Auth endpoints require X-Mood-Garden: 1 and check browser Origin. Swagger documents this header.
- Logout revokes the session; guards check session state so existing access JWTs also stop working immediately.
- Auth endpoints are rate limited per IP in memory (login/register: 10/minute). Use a shared store and explicit proxy configuration for multiple API instances.
- Registration creates preferences, garden and streak records with database defaults. API responses exclude password hashes and refresh tokens.
- Run `npm run test:integration -w @mood-garden/api` with the local database running and port 3002 free. It builds the API, starts an isolated HTTP server, checks auth/validation/rotation/isolation/rate limits, and removes only its own uniquely generated test users.
- Browser checks cover registration, profile, preferences persistence and session restoration. Email verification and password recovery are not implemented.

Implementation references: [NestJS authentication](https://docs.nestjs.com/security/authentication), [NestJS rate limiting](https://docs.nestjs.com/security/rate-limiting).
