import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/validate-env';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MoodsModule } from './moods/moods.module';
import { GardensModule } from './gardens/gardens.module';
import { WardrobeModule } from './wardrobe/wardrobe.module';
import { WeatherModule } from './weather/weather.module';
import { OutfitsModule } from './outfits/outfits.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), PrismaModule, AuthModule, UsersModule, MoodsModule, GardensModule, WardrobeModule, WeatherModule, OutfitsModule],
  controllers: [HealthController],
})
export class AppModule {}
