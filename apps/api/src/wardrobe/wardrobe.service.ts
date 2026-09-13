import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWardrobeItemDto } from './dto/create-wardrobe-item.dto';
import { UpdateWardrobeItemDto } from './dto/update-wardrobe-item.dto';

@Injectable()
export class WardrobeService {
  constructor(private readonly prisma: PrismaService) {}

  private async productImage(purchaseUrl?: string) {
    if (!purchaseUrl) return undefined;
    const url = new URL(purchaseUrl);
    if (url.protocol !== 'https:' || (url.hostname !== 'shopee.vn' && !url.hostname.endsWith('.shopee.vn'))) return undefined;
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'MoodGarden/1.0 product-preview', accept: 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return undefined;
      const html = await response.text();
      const image = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1]
        ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i)?.[1];
      if (!image) return undefined;
      const imageUrl = new URL(image, url).toString();
      return imageUrl.startsWith('https://') ? imageUrl : undefined;
    } catch { return undefined; }
  }

  list(userId: string) {
    return this.prisma.wardrobeItem.findMany({ where: { userId, isActive: true }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, dto: CreateWardrobeItemDto) {
    if (dto.minTemp > dto.maxTemp) throw new BadRequestException('Nhiệt độ tối thiểu không thể cao hơn nhiệt độ tối đa.');
    const imageUrl = dto.imageUrl ?? await this.productImage(dto.purchaseUrl);
    return this.prisma.wardrobeItem.create({ data: { userId, ...dto, imageUrl } });
  }

  async resolveImage(userId: string, id: string) {
    const item = await this.prisma.wardrobeItem.findFirst({ where: { id, userId, isActive: true } });
    if (!item) throw new NotFoundException('Không tìm thấy món đồ.');
    const imageUrl = await this.productImage(item.purchaseUrl ?? undefined);
    if (!imageUrl) throw new BadRequestException('Chưa lấy được ảnh từ trang sản phẩm.');
    return this.prisma.wardrobeItem.update({ where: { id }, data: { imageUrl } });
  }

  async setImage(userId: string, id: string, imageUrl: string) {
    const item = await this.prisma.wardrobeItem.findFirst({ where: { id, userId, isActive: true }, select: { id: true } });
    if (!item) throw new NotFoundException('Không tìm thấy món đồ.');
    return this.prisma.wardrobeItem.update({ where: { id }, data: { imageUrl } });
  }

  async update(userId: string, id: string, dto: UpdateWardrobeItemDto) {
    const item = await this.prisma.wardrobeItem.findFirst({ where: { id, userId, isActive: true }, select: { id: true, minTemp: true, maxTemp: true } });
    if (!item) throw new NotFoundException('Không tìm thấy món đồ.');
    const minTemp = dto.minTemp ?? item.minTemp;
    const maxTemp = dto.maxTemp ?? item.maxTemp;
    if (minTemp > maxTemp) throw new BadRequestException('Nhiệt độ tối thiểu không thể cao hơn nhiệt độ tối đa.');
    return this.prisma.wardrobeItem.update({ where: { id }, data: dto });
  }
}
