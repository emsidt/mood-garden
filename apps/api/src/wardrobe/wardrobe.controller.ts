import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, AuthRequest } from '../auth/guards/access.guard';
import { CreateWardrobeItemDto } from './dto/create-wardrobe-item.dto';
import { UpdateWardrobeImageDto } from './dto/update-wardrobe-image.dto';
import { UpdateWardrobeItemDto } from './dto/update-wardrobe-item.dto';
import { WardrobeService } from './wardrobe.service';

@ApiTags('wardrobe')
@ApiBearerAuth()
@UseGuards(AccessGuard)
@Controller('wardrobe')
export class WardrobeController {
  constructor(private readonly wardrobe: WardrobeService) {}
  @Get()
  list(@Req() req: AuthRequest) { return this.wardrobe.list(req.user.id); }
  @Post()
  create(@Req() req: AuthRequest, @Body() dto: CreateWardrobeItemDto) { return this.wardrobe.create(req.user.id, dto); }
  @Post(':id/resolve-image')
  resolveImage(@Req() req: AuthRequest, @Param('id') id: string) { return this.wardrobe.resolveImage(req.user.id, id); }
  @Patch(':id/image')
  setImage(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateWardrobeImageDto) { return this.wardrobe.setImage(req.user.id, id, dto.imageUrl); }
  @Patch(':id')
  update(@Req() req: AuthRequest, @Param('id') id: string, @Body() dto: UpdateWardrobeItemDto) { return this.wardrobe.update(req.user.id, id, dto); }
}
