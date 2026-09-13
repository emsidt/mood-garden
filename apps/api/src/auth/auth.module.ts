import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessGuard } from './guards/access.guard';
import { OriginGuard } from './guards/origin.guard';
@Module({
  imports: [
    JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({
      secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      signOptions: { expiresIn: 900, algorithm: 'HS256', issuer: 'mood-garden', audience: 'mood-garden-web' },
      verifyOptions: { issuer: 'mood-garden', audience: 'mood-garden-web' },
    }) }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
  ],
  controllers: [AuthController], providers: [AuthService, AccessGuard, OriginGuard],
  exports: [AccessGuard, JwtModule],
})
export class AuthModule {}
