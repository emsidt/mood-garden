import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';

@Module({ imports: [AuthModule], controllers: [WeatherController], providers: [WeatherService], exports: [WeatherService] })
export class WeatherModule {}
