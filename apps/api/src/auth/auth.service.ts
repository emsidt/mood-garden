import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { hashPassword, verifyPassword } from './password';
export const publicUser = { id: true, email: true, username: true, avatarUrl: true, createdAt: true } satisfies Prisma.UserSelect;
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
const lifetime = 30 * 24 * 60 * 60 * 1000;
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly dummyHash = hashPassword(randomBytes(32).toString('hex'));
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async register(dto: RegisterDto) {
    const passwordHash = await hashPassword(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: { email: dto.email, username: dto.username, passwordHash,
          preferences: { create: {} }, garden: { create: {} }, streak: { create: {} } },
        select: publicUser,
      });
      return this.createSession(user.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Email hoặc tên người dùng đã được sử dụng.');
      throw error;
    }
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({ where: { OR: [{ email: dto.identifier }, { username: dto.identifier }] } });
    const valid = await verifyPassword(dto.password, user?.passwordHash ?? await this.dummyHash);
    if (!user || !valid) {
      this.logger.warn('Login rejected: invalid credentials');
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    }
    return this.createSession(user.id);
  }
  private async createSession(userId: string) {
    const token = randomBytes(48).toString('base64url');
    const session = await this.prisma.refreshToken.create({
      data: { userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + lifetime) },
    });
    return this.result(userId, session.id, token);
  }
  private async result(userId: string, sessionId: string, refreshToken: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUser });
    return { user, refreshToken, accessToken: await this.jwt.signAsync({ sub: userId, sid: sessionId }), expiresIn: 900 };
  }
  async refresh(token: unknown) {
    if (typeof token !== 'string' || token.length > 200) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    const nextToken = randomBytes(48).toString('base64url');
    const session = await this.prisma.refreshToken.findUnique({ where: { tokenHash: digest(token) } });
    if (!session) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    // Atomic compare-and-swap: one successful rotation per token, including concurrent requests.
    const updated = await this.prisma.refreshToken.updateMany({
      where: { id: session.id, tokenHash: digest(token), revokedAt: null, expiresAt: { gt: new Date() } },
      data: { tokenHash: digest(nextToken) },
    });
    if (updated.count !== 1) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn.');
    return this.result(session.userId, session.id, nextToken);
  }
  async logout(token: unknown) {
    if (typeof token === 'string' && token.length <= 200)
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: digest(token), revokedAt: null }, data: { revokedAt: new Date() },
      });
  }
}
