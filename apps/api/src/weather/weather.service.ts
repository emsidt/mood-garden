import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type CurrentWeather = {
  city: string;
  temperature: number;
  feelsLike: number;
  condition: 'CLEAR' | 'CLOUDY' | 'RAIN' | 'DRIZZLE' | 'THUNDERSTORM' | 'SNOW' | 'MIST';
  conditionText: string;
  rain: boolean;
  windSpeed: number;
  humidity: number;
  uvIndex: number;
  observedAt: string;
};
type CacheEntry = { expiresAt: number; value: CurrentWeather };
type ProviderResponse = {
  location: { name: string };
  current: { temp_c: number; feelslike_c: number; condition: { text: string; code: number }; precip_mm: number; wind_kph: number; humidity: number; uv: number; last_updated_epoch: number };
};

function normaliseCondition(code: number, rain: boolean): CurrentWeather['condition'] {
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'THUNDERSTORM';
  if ([1066, 1069, 1072, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) return 'SNOW';
  if ([1030, 1135, 1147].includes(code)) return 'MIST';
  if (rain || [1063, 1150, 1153, 1168, 1171].includes(code)) return code >= 1180 ? 'RAIN' : 'DRIZZLE';
  if ([1003, 1006, 1009].includes(code)) return 'CLOUDY';
  return 'CLEAR';
}
function providerCity(city: string) {
  const normalised = city.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase();
  const aliases: Record<string, string> = {
    'ha noi': 'Hanoi, Vietnam',
    hanoi: 'Hanoi, Vietnam',
    'ho chi minh': 'Ho Chi Minh City, Vietnam',
    'ho chi minh city': 'Ho Chi Minh City, Vietnam',
    'sai gon': 'Ho Chi Minh City, Vietnam',
    'da nang': 'Da Nang, Vietnam',
  };
  return aliases[normalised] ?? city;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly cacheMs = 15 * 60 * 1000;
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async current(userId: string): Promise<CurrentWeather> {
    const preference = await this.prisma.userPreference.findUniqueOrThrow({ where: { userId }, select: { city: true } });
    return this.forCity(preference.city);
  }

  private async forCity(city: string): Promise<CurrentWeather> {
    const key = city.trim().toLocaleLowerCase();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const url = new URL('https://api.weatherapi.com/v1/current.json');
    url.search = new URLSearchParams({ key: this.config.getOrThrow<string>('WEATHER_API_KEY'), q: providerCity(city), aqi: 'no' }).toString();
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) {
        this.logger.warn('Weather provider returned HTTP ' + response.status + ' for city lookup');
        throw new ServiceUnavailableException('Không thể lấy thời tiết lúc này.');
      }
      const raw = await response.json() as ProviderResponse;
      const rain = raw.current.precip_mm > 0;
      const value: CurrentWeather = {
        city: raw.location.name, temperature: raw.current.temp_c, feelsLike: raw.current.feelslike_c,
        condition: normaliseCondition(raw.current.condition.code, rain), conditionText: raw.current.condition.text,
        rain, windSpeed: raw.current.wind_kph, humidity: raw.current.humidity, uvIndex: raw.current.uv,
        observedAt: new Date(raw.current.last_updated_epoch * 1000).toISOString(),
      };
      this.cache.set(key, { value, expiresAt: Date.now() + this.cacheMs });
      return value;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('Weather provider request failed');
      throw new ServiceUnavailableException('Không thể kết nối dịch vụ thời tiết.');
    }
  }
}
