import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const unlocks = [
  { level: 1, name: 'Thảm cỏ non', icon: '🌱', description: 'Một góc đất dịu dàng để bắt đầu.' },
  { level: 2, name: 'Cúc nhỏ', icon: '🌼', description: 'Nở sau vài lần bạn trở về.' },
  { level: 3, name: 'Tulip', icon: '🌷', description: 'Một sắc màu mới cho khu vườn.' },
  { level: 5, name: 'Cây non', icon: '🌳', description: 'Lớn lên bền bỉ theo thời gian.' },
  { level: 10, name: 'Hoa hiếm', icon: '🪷', description: 'Dành cho một hành trình dài.' },
];
function xpForNextLevel(level: number) { return 50 * level * level; }
@Injectable()
export class GardensService {
  constructor(private readonly prisma: PrismaService) {}
  async mine(userId: string) {
    const [garden, streak] = await Promise.all([this.prisma.garden.findUniqueOrThrow({ where: { userId } }), this.prisma.moodStreak.findUniqueOrThrow({ where: { userId } })]);
    const currentTarget = xpForNextLevel(garden.level), previousTarget = xpForNextLevel(Math.max(0, garden.level - 1));
    return { ...garden, streak: { current: streak.currentStreak, longest: streak.longestStreak }, progress: { current: garden.experience - previousTarget, target: currentTarget - previousTarget, nextLevelAt: currentTarget }, unlocked: unlocks.filter(item => item.level <= garden.level), nextUnlock: unlocks.find(item => item.level > garden.level) ?? null };
  }
  catalog() { return unlocks; }
}
