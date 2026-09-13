import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
export type AuthRequest = Request & { user: { id: string; sessionId: string } };
@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const match = /^Bearer (\S+)$/.exec(request.headers.authorization ?? '');
    if (!match) throw new UnauthorizedException('Vui lòng đăng nhập.');
    let payload: { sub: string; sid: string };
    try {
      payload = await this.jwt.verifyAsync(match[1], { algorithms: ['HS256'] });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') throw new Error();
    } catch { throw new UnauthorizedException('Phiên đăng nhập không hợp lệ.'); }
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!session) throw new UnauthorizedException('Phiên đăng nhập đã kết thúc.');
    request.user = { id: payload.sub, sessionId: payload.sid };
    return true;
  }
}
