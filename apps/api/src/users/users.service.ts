import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../generated/prisma/client';
import { publicUser } from '../auth/auth.service';
import { UpdatePreferencesDto, UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  me(id: string) { return this.prisma.user.findUniqueOrThrow({ where: { id }, select: publicUser }); }
  async update(id: string, dto: UpdateUserDto) {
    try { return await this.prisma.user.update({ where: { id }, data: dto, select: publicUser }); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
        throw new ConflictException('Tên người dùng đã được sử dụng.');
      throw error;
    }
  }
  preferences(userId: string) { return this.prisma.userPreference.findUniqueOrThrow({ where: { userId } }); }
  updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.userPreference.update({ where: { userId }, data: dto });
  }
}
