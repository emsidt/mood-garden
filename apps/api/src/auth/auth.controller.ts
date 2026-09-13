import { Body, Controller, Header, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { OriginGuard } from './guards/origin.guard';
const cookieName = 'mg_refresh';
@ApiTags('auth')
@ApiHeader({ name: 'X-Mood-Garden', required: true, schema: { default: '1' } })
@UseGuards(OriginGuard, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}
  private cookieOptions(): CookieOptions {
    return { httpOnly: true, secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax', path: '/api/auth', maxAge: 30 * 24 * 60 * 60 * 1000 };
  }
  private send(res: Response, result: Awaited<ReturnType<AuthService['login']>>) {
    const { refreshToken, ...body } = result;
    res.cookie(cookieName, refreshToken, this.cookieOptions());
    return body;
  }
  @Post('register') @Header('Cache-Control', 'no-store')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.send(res, await this.auth.register(dto));
  }
  @Post('login') @HttpCode(200) @Header('Cache-Control', 'no-store')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.send(res, await this.auth.login(dto));
  }
  @Post('refresh') @HttpCode(200) @Header('Cache-Control', 'no-store')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.send(res, await this.auth.refresh(req.cookies?.[cookieName]));
  }
  @Post('logout') @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[cookieName]);
    const { maxAge, ...options } = this.cookieOptions();
    res.clearCookie(cookieName, options);
  }
}
