import { Controller, Get, Header, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccessGuard, AuthRequest } from '../auth/guards/access.guard';
import { WeatherService } from './weather.service';

@ApiTags('weather')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('weather')
export class WeatherController {
  constructor(private readonly weather: WeatherService) {}
  @Get('current')
  // The server owns the 15-minute provider cache. Do not let browsers cache transient provider failures.
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Current weather for the signed-in user’s selected city' })
  current(@Req() req: AuthRequest) { return this.weather.current(req.user.id); }
}
