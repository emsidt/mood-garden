import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
const unlocks = [
  { level: 1, name: 'Thảm cỏ non', icon: '🌱', description: 'Một góc đất dịu dàng để bắt đầu.' },
  { level: 2, name: 'Cúc nhỏ', icon: '🌼', description: 'Nở sau vài lần bạn trở về.' },
  { level: 3, name: 'Tulip', icon: '🌷', description: 'Một sắc màu mới cho khu vườn.' },
  { level: 5, name: 'Cây non', icon: '🌳', description: 'Lớn lên bền bỉ theo thời gian.' },
  { level: 10, name: 'Hoa hiếm', icon: '🪷', description: 'Dành cho một hành trình dài.' },
];
export const DECOR_CATALOG = [
  { id: 'cat_sleeping', name: 'Mèo lười', icon: '🐈', price: 50, description: 'Một chú mèo thích ngủ nướng trên bãi cỏ.' },
  { id: 'lantern', name: 'Đèn lồng đom đóm', icon: '🏮', price: 30, description: 'Tỏa sáng ấm áp vào ban đêm.' },
  { id: 'bird', name: 'Chim họa mi', icon: '🕊️', price: 40, description: 'Bay lượn và hót líu lo.' },
];
function xpForNextLevel(level: number) { return 50 * level * level; }
@Injectable()
export class GardensService {
  constructor(private readonly prisma: PrismaService) {}
  async mine(userId: string) {
    const [garden, streak] = await Promise.all([this.prisma.garden.findUniqueOrThrow({ where: { userId }, include: { decor: true } }), this.prisma.moodStreak.findUniqueOrThrow({ where: { userId } })]);
    const currentTarget = xpForNextLevel(garden.level), previousTarget = xpForNextLevel(Math.max(0, garden.level - 1));
    return { ...garden, streak: { current: streak.currentStreak, longest: streak.longestStreak }, progress: { current: garden.experience - previousTarget, target: currentTarget - previousTarget, nextLevelAt: currentTarget }, unlocked: unlocks.filter(item => item.level <= garden.level), nextUnlock: unlocks.find(item => item.level > garden.level) ?? null };
  }
  catalog() { return { unlocks, decor: DECOR_CATALOG }; }
  async buyDecor(userId: string, decorId: string) {
    const item = DECOR_CATALOG.find(d => d.id === decorId);
    if (!item) throw new BadRequestException('Vật phẩm không tồn tại');
    return this.prisma.$transaction(async tx => {
      const garden = await tx.garden.findUniqueOrThrow({ where: { userId } });
      if (garden.seeds < item.price) throw new BadRequestException('Không đủ Hạt giống');
      const existing = await tx.purchasedDecor.findFirst({ where: { gardenId: garden.id, decorId } });
      if (existing) throw new ConflictException('Bạn đã sở hữu vật phẩm này');
      await tx.garden.update({ where: { id: garden.id }, data: { seeds: { decrement: item.price } } });
      const purchased = await tx.purchasedDecor.create({ data: { gardenId: garden.id, decorId } });
      return purchased;
    });
  }
}
