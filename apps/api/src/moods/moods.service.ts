import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Mood } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMoodDto } from './dto/create-mood.dto';
const XP_PER_CHECK_IN = 25;
function dateInTimezone(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find(item => item.type === type)!.value;
  return new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day'))));
}
function previousDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 1)); }
function levelFor(experience: number) { return Math.floor(Math.sqrt(experience / 50)) + 1; }
@Injectable()
export class MoodsService {
  constructor(private readonly prisma: PrismaService) {}
  async today(userId: string) {
    const preference = await this.prisma.userPreference.findUniqueOrThrow({ where: { userId } });
    return this.prisma.moodEntry.findUnique({ where: { userId_entryDate: { userId, entryDate: dateInTimezone(preference.timezone) } } });
  }
  history(userId: string) { return this.prisma.moodEntry.findMany({ where: { userId }, orderBy: { entryDate: 'desc' }, take: 60, select: { id: true, mood: true, note: true, entryDate: true, createdAt: true } }); }
  async statistics(userId: string) {
    const entries = await this.prisma.moodEntry.findMany({ where: { userId }, select: { mood: true } });
    const counts = Object.values(Mood).reduce<Record<string, number>>((acc, mood) => ({ ...acc, [mood]: 0 }), {});
    for (const entry of entries) counts[entry.mood] += 1;
    return { total: entries.length, counts };
  }
  async create(userId: string, dto: CreateMoodDto) {
    const preference = await this.prisma.userPreference.findUniqueOrThrow({ where: { userId } });
    const entryDate = dateInTimezone(preference.timezone);
    try {
      return await this.prisma.$transaction(async tx => {
        const entry = await tx.moodEntry.create({ data: { userId, mood: dto.mood, note: dto.note, entryDate } });
        const streak = await tx.moodStreak.findUniqueOrThrow({ where: { userId } });
        const currentStreak = streak.lastCheckInDate?.getTime() === previousDay(entryDate).getTime() ? streak.currentStreak + 1 : 1;
        const updatedStreak = await tx.moodStreak.update({ where: { userId }, data: { currentStreak, longestStreak: Math.max(streak.longestStreak, currentStreak), lastCheckInDate: entryDate } });
        const garden = await tx.garden.update({ where: { userId }, data: { experience: { increment: XP_PER_CHECK_IN } } });
        const level = levelFor(garden.experience);
        const updatedGarden = level !== garden.level ? await tx.garden.update({ where: { userId }, data: { level } }) : garden;
        return { entry, streak: updatedStreak, garden: updatedGarden, gainedExperience: XP_PER_CHECK_IN, leveledUp: level > garden.level };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Bạn đã ghi lại cảm xúc cho hôm nay rồi.');
      throw error;
    }
  }
}
