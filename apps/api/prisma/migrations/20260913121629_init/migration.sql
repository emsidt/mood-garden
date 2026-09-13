-- CreateEnum
CREATE TYPE "Mood" AS ENUM ('HAPPY', 'CALM', 'EXCITED', 'TIRED', 'SAD', 'STRESSED');

-- CreateEnum
CREATE TYPE "ClothingCategory" AS ENUM ('TOP', 'BOTTOM', 'OUTERWEAR', 'SHOES', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "ClothingStyle" AS ENUM ('CASUAL', 'STREETWEAR', 'FORMAL', 'SPORT', 'MINIMAL');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('LIKE', 'DISLIKE', 'TOO_HOT', 'TOO_COLD', 'NOT_MY_STYLE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Ho Chi Minh City',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    "preferred_style" "ClothingStyle" NOT NULL DEFAULT 'CASUAL',
    "temperature_tolerance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "mood" "Mood" NOT NULL,
    "note" VARCHAR(2000),
    "entry_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mood_streaks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_check_in_date" DATE,

    CONSTRAINT "mood_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gardens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "theme" TEXT NOT NULL DEFAULT 'meadow',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gardens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plant_catalog" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "required_level" INTEGER NOT NULL DEFAULT 1,
    "image_url" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'COMMON',

    CONSTRAINT "plant_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garden_items" (
    "id" UUID NOT NULL,
    "garden_id" UUID NOT NULL,
    "plant_id" UUID NOT NULL,
    "position_x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "position_y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garden_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wardrobe_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ClothingCategory" NOT NULL,
    "color" TEXT NOT NULL,
    "style" "ClothingStyle" NOT NULL,
    "image_url" TEXT,
    "min_temp" DOUBLE PRECISION NOT NULL,
    "max_temp" DOUBLE PRECISION NOT NULL,
    "waterproof" BOOLEAN NOT NULL DEFAULT false,
    "wind_resistant" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wardrobe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_snapshots" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "city" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "feels_like" DOUBLE PRECISION NOT NULL,
    "condition" TEXT NOT NULL,
    "rain" BOOLEAN NOT NULL,
    "wind_speed" DOUBLE PRECISION NOT NULL,
    "humidity" INTEGER NOT NULL,
    "uv_index" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_recommendations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "weather_snapshot_id" UUID NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfit_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_items" (
    "id" UUID NOT NULL,
    "outfit_recommendation_id" UUID NOT NULL,
    "wardrobe_item_id" UUID NOT NULL,

    CONSTRAINT "outfit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outfit_feedback" (
    "id" UUID NOT NULL,
    "outfit_recommendation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "feedback_type" "FeedbackType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outfit_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_user_id_key" ON "user_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mood_entries_user_id_entry_date_key" ON "mood_entries"("user_id", "entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "mood_streaks_user_id_key" ON "mood_streaks"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "gardens_user_id_key" ON "gardens"("user_id");

-- CreateIndex
CREATE INDEX "garden_items_garden_id_idx" ON "garden_items"("garden_id");

-- CreateIndex
CREATE INDEX "garden_items_plant_id_idx" ON "garden_items"("plant_id");

-- CreateIndex
CREATE INDEX "wardrobe_items_user_id_is_active_category_idx" ON "wardrobe_items"("user_id", "is_active", "category");

-- CreateIndex
CREATE INDEX "weather_snapshots_user_id_created_at_idx" ON "weather_snapshots"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "outfit_recommendations_user_id_created_at_idx" ON "outfit_recommendations"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "outfit_recommendations_weather_snapshot_id_idx" ON "outfit_recommendations"("weather_snapshot_id");

-- CreateIndex
CREATE INDEX "outfit_items_wardrobe_item_id_idx" ON "outfit_items"("wardrobe_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "outfit_items_outfit_recommendation_id_wardrobe_item_id_key" ON "outfit_items"("outfit_recommendation_id", "wardrobe_item_id");

-- CreateIndex
CREATE INDEX "outfit_feedback_user_id_idx" ON "outfit_feedback"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "outfit_feedback_outfit_recommendation_id_user_id_feedback_t_key" ON "outfit_feedback"("outfit_recommendation_id", "user_id", "feedback_type");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_entries" ADD CONSTRAINT "mood_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mood_streaks" ADD CONSTRAINT "mood_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gardens" ADD CONSTRAINT "gardens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_items" ADD CONSTRAINT "garden_items_garden_id_fkey" FOREIGN KEY ("garden_id") REFERENCES "gardens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "garden_items" ADD CONSTRAINT "garden_items_plant_id_fkey" FOREIGN KEY ("plant_id") REFERENCES "plant_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wardrobe_items" ADD CONSTRAINT "wardrobe_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_snapshots" ADD CONSTRAINT "weather_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_recommendations" ADD CONSTRAINT "outfit_recommendations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_recommendations" ADD CONSTRAINT "outfit_recommendations_weather_snapshot_id_fkey" FOREIGN KEY ("weather_snapshot_id") REFERENCES "weather_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_outfit_recommendation_id_fkey" FOREIGN KEY ("outfit_recommendation_id") REFERENCES "outfit_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_items" ADD CONSTRAINT "outfit_items_wardrobe_item_id_fkey" FOREIGN KEY ("wardrobe_item_id") REFERENCES "wardrobe_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_feedback" ADD CONSTRAINT "outfit_feedback_outfit_recommendation_id_fkey" FOREIGN KEY ("outfit_recommendation_id") REFERENCES "outfit_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outfit_feedback" ADD CONSTRAINT "outfit_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
