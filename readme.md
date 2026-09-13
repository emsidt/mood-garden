# Mood Garden

> Local setup and scaffold status: [Development guide](docs/development.md).

A chill full-stack project that combines **daily mood tracking**, a **virtual garden**, **real-time weather**, and **weather-aware outfit recommendations**.

The product should feel relaxing and playful on the frontend, while the backend is designed seriously enough to practice real application architecture.

---

## 1. Project Overview

Mood Garden is a personal daily companion app.

Each day, users can:

- Check in with their current mood.
- Watch their virtual garden evolve over time.
- View current weather conditions.
- Receive outfit recommendations based on weather and personal preferences.
- Add their own clothes to a personal wardrobe.
- Randomize another suitable outfit when they do not like the current recommendation.
- Review mood history and previous outfit recommendations.

The outfit recommendation system should not be purely random. It should first filter and score clothing based on weather, preferences, and recent usage, then add a small amount of randomness.

---

## 2. Main Goals

### Product Goals

- Create a relaxing and visually pleasant daily-use application.
- Make mood tracking feel less like a productivity tool.
- Turn consistency into visible garden progression.
- Help users decide what to wear based on real weather.
- Allow users to build a personal digital wardrobe.

### Technical Goals

- Build a proper REST API.
- Practice authentication with access and refresh tokens.
- Use PostgreSQL with a structured relational schema.
- Integrate a third-party weather API.
- Implement recommendation/scoring logic.
- Handle image uploads.
- Add validation, error handling, logging, API documentation, and caching.
- Deploy frontend, backend, and database separately.

---

## 3. Tech Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- TanStack Query
- Axios

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- Swagger / OpenAPI

### External Services

- Weather API: OpenWeatherMap or WeatherAPI
- Image Storage: Cloudinary or S3-compatible storage

### Deployment

Possible setup:

- Frontend: Vercel
- Backend: Railway / Render
- Database: PostgreSQL on Railway / Neon / Supabase
- Image storage: Cloudinary

---

## 4. Core Features

## 4.1 Authentication

Users can:

- Register
- Login
- Refresh access token
- Logout
- View their own profile

Authentication should use:

- Short-lived access token
- Long-lived refresh token
- Password hashing
- Protected routes

---

## 4.2 Mood Check-in

Users select one mood per day.

Example moods:

- HAPPY
- CALM
- EXCITED
- TIRED
- SAD
- STRESSED

A mood entry may contain:

- Mood
- Optional note
- Timestamp

Users can view:

- Today's mood
- Mood history
- Mood calendar
- Mood statistics

Example:

```text
Monday     CALM
Tuesday    HAPPY
Wednesday  TIRED
Thursday   HAPPY
```

---

## 4.3 Mood Streak

The system tracks consecutive daily check-ins.

Example:

```text
Current streak: 7 days
Longest streak: 21 days
```

Streaks can affect garden progression.

---

## 4.4 Virtual Garden

Each user owns one garden.

The garden has:

- Level
- Experience points
- Unlocked plants
- Planted items
- Garden theme

Users earn progress by:

- Daily mood check-ins
- Maintaining streaks
- Returning regularly

Example progression:

```text
Level 1 -> Grass
Level 2 -> Daisy
Level 3 -> Tulip
Level 5 -> Small tree
Level 10 -> Rare flower
```

Garden progression should be cosmetic and relaxing rather than competitive.

---

## 4.5 Weather

The backend fetches weather information using the user's selected city.

Weather data may include:

- Temperature
- Feels-like temperature
- Weather condition
- Rain
- Wind speed
- Humidity
- UV index, if supported

Example response:

```json
{
  "temperature": 27,
  "feelsLike": 29,
  "condition": "CLOUDY",
  "rain": false,
  "windSpeed": 4.2,
  "humidity": 78
}
```

The frontend should not call the weather provider directly.

Flow:

```text
Frontend
   |
   v
Mood Garden Backend
   |
   v
Weather Provider
```

The backend should cache weather results for a short period.

---

## 4.6 Personal Wardrobe

Users can add clothing items.

Each wardrobe item can contain:

- Name
- Category
- Color
- Style
- Image
- Minimum recommended temperature
- Maximum recommended temperature
- Waterproof flag
- Wind-resistant flag
- Active / archived status

Example:

```json
{
  "name": "White Oversized Tee",
  "category": "TOP",
  "color": "WHITE",
  "style": "CASUAL",
  "minTemp": 24,
  "maxTemp": 35,
  "waterproof": false,
  "windResistant": false
}
```

Suggested categories:

```text
TOP
BOTTOM
OUTERWEAR
SHOES
ACCESSORY
```

Suggested styles:

```text
CASUAL
STREETWEAR
FORMAL
SPORT
MINIMAL
```

---

## 4.7 Outfit Recommendation

The system recommends an outfit using:

- Current weather
- User wardrobe
- User style preferences
- Temperature tolerance
- Rain conditions
- Wind conditions
- Recently worn items
- Small random factor

Recommendation flow:

```text
GET weather
   |
   v
Load wardrobe
   |
   v
Filter invalid clothing
   |
   v
Calculate item scores
   |
   v
Build valid combinations
   |
   v
Score complete outfits
   |
   v
Randomly select from top candidates
   |
   v
Return recommendation
```

---

## 5. Recommendation Logic

The recommendation system should avoid completely random outfit generation.

Possible score:

```text
Temperature match       +40
Weather compatibility   +20
Style preference        +15
Color compatibility     +10
Not worn recently       +10
Random factor            +5
```

Maximum example score:

```text
100 points
```

### Temperature Rules

Example:

```text
>= 30°C
- T-shirt
- Short-sleeve shirt
- Shorts
- Thin pants
- Breathable sneakers

24-29°C
- T-shirt
- Polo
- Shirt
- Jeans
- Chinos
- Sneakers

18-23°C
- Long-sleeve shirt
- Sweatshirt
- Light jacket
- Long pants

< 18°C
- Hoodie
- Sweater
- Jacket
- Long pants
```

### Weather Modifiers

Rain:

```text
+ waterproof outerwear
+ waterproof shoes
+ umbrella suggestion
- white shoes when possible
```

Strong wind:

```text
+ wind-resistant jacket
```

High UV:

```text
+ cap
+ sunscreen reminder
```

---

## 6. Outfit Randomization

Users can press:

```text
Randomize Again
```

This should not ignore recommendation rules.

Instead:

1. Generate the top N valid outfit candidates.
2. Apply weighted randomness.
3. Prefer an outfit different from the previous recommendation.

Example:

```text
Candidate A: score 92
Candidate B: score 89
Candidate C: score 87
Candidate D: score 83
```

The system randomly selects one of the highest-scoring candidates.

---

## 7. Outfit Feedback

Users can give feedback:

- Like
- Dislike
- Favorite
- Too hot
- Too cold
- Not my style

This data can later improve recommendations.

Example:

```text
User repeatedly selects "Too hot"
-> reduce effective temperature tolerance
```

---

## 8. Suggested Database Schema

## users

```text
id
email
username
password_hash
avatar_url
created_at
updated_at
```

## user_preferences

```text
id
user_id
city
preferred_style
temperature_tolerance
created_at
updated_at
```

## mood_entries

```text
id
user_id
mood
note
created_at
```

Constraint:

```text
One mood entry per user per day
```

## mood_streaks

```text
id
user_id
current_streak
longest_streak
last_check_in_date
```

## gardens

```text
id
user_id
level
experience
theme
created_at
updated_at
```

## plant_catalog

```text
id
name
required_level
image_url
rarity
```

## garden_items

```text
id
garden_id
plant_id
position_x
position_y
unlocked_at
```

## wardrobe_items

```text
id
user_id
name
category
color
style
image_url
min_temp
max_temp
waterproof
wind_resistant
is_active
created_at
updated_at
```

## weather_snapshots

```text
id
user_id
city
temperature
feels_like
condition
rain
wind_speed
humidity
created_at
```

## outfit_recommendations

```text
id
user_id
weather_snapshot_id
score
is_favorite
created_at
```

## outfit_items

```text
id
outfit_recommendation_id
wardrobe_item_id
```

## outfit_feedback

```text
id
outfit_recommendation_id
user_id
feedback_type
created_at
```

---

## 9. Suggested REST API

### Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

### Users

```http
GET   /api/users/me
PATCH /api/users/me
GET   /api/users/me/preferences
PATCH /api/users/me/preferences
```

### Mood

```http
POST /api/moods
GET  /api/moods/today
GET  /api/moods/history
GET  /api/moods/statistics
GET  /api/moods/streak
```

### Garden

```http
GET  /api/garden
GET  /api/garden/catalog
POST /api/garden/items
PATCH /api/garden/items/:id
```

### Wardrobe

```http
POST   /api/wardrobe
GET    /api/wardrobe
GET    /api/wardrobe/:id
PATCH  /api/wardrobe/:id
DELETE /api/wardrobe/:id
```

### Weather

```http
GET /api/weather/current
```

Example:

```http
GET /api/weather/current?city=Hanoi
```

### Outfit

```http
POST /api/outfits/recommend
POST /api/outfits/randomize
GET  /api/outfits/history
GET  /api/outfits/:id
POST /api/outfits/:id/favorite
POST /api/outfits/:id/feedback
```

---

## 10. Backend Project Structure

```text
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── guards/
│   └── strategies/
│
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│
├── moods/
│   ├── moods.controller.ts
│   ├── moods.service.ts
│   └── dto/
│
├── gardens/
│   ├── gardens.controller.ts
│   ├── gardens.service.ts
│   └── dto/
│
├── wardrobe/
│   ├── wardrobe.controller.ts
│   ├── wardrobe.service.ts
│   └── dto/
│
├── weather/
│   ├── weather.controller.ts
│   ├── weather.service.ts
│   └── weather-provider.service.ts
│
├── outfits/
│   ├── outfits.controller.ts
│   ├── outfits.service.ts
│   ├── recommendation.service.ts
│   ├── scoring/
│   │   ├── temperature.scorer.ts
│   │   ├── weather.scorer.ts
│   │   ├── style.scorer.ts
│   │   └── recency.scorer.ts
│   └── dto/
│
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── app.module.ts
└── main.ts
```

---

## 11. Backend Requirements

The backend should include:

### Validation

Use DTO validation for incoming requests.

Examples:

```text
email must be valid
password must meet minimum requirements
temperature range must be valid
wardrobe category must use supported enum
```

### Error Handling

Create consistent API error responses.

Example:

```json
{
  "statusCode": 404,
  "message": "Wardrobe item not found",
  "error": "Not Found"
}
```

### Logging

Log:

- Authentication errors
- External weather API failures
- Recommendation errors
- Unexpected server exceptions

### API Documentation

Use Swagger.

Suggested URL:

```text
/api/docs
```

### Security

Include:

- Password hashing
- JWT access token
- Refresh token
- Route guards
- Request validation
- Environment variables
- Rate limiting where appropriate

---

## 12. Weather Caching

Do not call the external weather provider every time the frontend refreshes.

Example strategy:

```text
Cache weather by city for 10-15 minutes.
```

Flow:

```text
Request weather
   |
   v
Check cache
   |
   +-- valid --> return cached result
   |
   +-- expired --> call provider
                       |
                       v
                    cache result
                       |
                       v
                     return
```

Redis can be added later, but an in-memory cache is enough for the first version.

---

## 13. MVP

The first usable version should contain only:

### Authentication

- Register
- Login
- Current user

### Mood

- Daily mood check-in
- Mood history

### Weather

- Current weather by city

### Wardrobe

- Add clothing
- List clothing
- Edit clothing
- Delete clothing

### Outfit

- Weather-aware outfit recommendation
- Randomize another valid outfit

### Garden

- Basic garden
- Experience points from daily check-ins
- Level system

Avoid adding too many features before the MVP works.

---

## 14. Development Phases

### Phase 1 - Foundation

- Create React frontend
- Create NestJS backend
- Setup PostgreSQL
- Setup Prisma
- Configure environment variables
- Configure Swagger

### Phase 2 - Authentication

- Register
- Login
- JWT access token
- Refresh token
- User profile

### Phase 3 - Mood

- Mood check-in
- Daily uniqueness constraint
- Mood history
- Streak logic

### Phase 4 - Weather

- Integrate weather provider
- Normalize weather data
- Add caching

### Phase 5 - Wardrobe

- Wardrobe CRUD
- Clothing metadata
- Image upload

### Phase 6 - Outfit Engine

- Filter clothing
- Implement scoring
- Build valid outfits
- Randomize from top recommendations

### Phase 7 - Garden

- XP
- Level system
- Plant unlock system

### Phase 8 - Polish

- Outfit feedback
- Mood calendar
- Better garden animations
- Statistics
- Deployment

---

## 15. Possible Future Features

- AI-generated outfit explanation
- Automatic clothing tagging from uploaded images
- Mood-based outfit suggestions
- Seasonal garden themes
- Friends and shared gardens
- Weekly mood report
- Weekly outfit report
- Outfit calendar
- Laundry status
- Favorite color combinations
- Weather alerts
- Packing suggestions for trips
- PWA support
- Mobile application

---

## 16. Product Direction

The frontend should feel:

```text
calm
soft
cozy
playful
minimal
```

The backend should feel:

```text
structured
modular
maintainable
testable
production-inspired
```

The goal is to keep the app fun to build while still having enough backend depth to practice real full-stack development.

---

## 17. Working Name

### Mood Garden

Possible alternative names:

- BloomFit
- Daily Bloom
- MoodBloom
- Bloom & Wear
- Garden Day

Possible tagline:

> How you feel, what you wear, how your garden grows.
