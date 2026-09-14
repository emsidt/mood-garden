import { Body, Controller, Get, Header, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, AuthRequest } from '../auth/guards/access.guard';
import { CreateMoodDto } from './dto/create-mood.dto';
import { MoodsService } from './moods.service';
@ApiTags('moods') @ApiBearerAuth() @UseGuards(AccessGuard) @Controller('moods')
export class MoodsController {
  constructor(private readonly moods: MoodsService) {}
  @Get('today') @Header('Cache-Control', 'no-store') today(@Req() req: AuthRequest) { return this.moods.today(req.user.id); }
  @Get('history') @Header('Cache-Control', 'no-store') history(@Req() req: AuthRequest) { return this.moods.history(req.user.id); }
  @Get('statistics') @Header('Cache-Control', 'no-store') statistics(@Req() req: AuthRequest) { return this.moods.statistics(req.user.id); }
  @Post() create(@Req() req: AuthRequest, @Body() dto: CreateMoodDto) { return this.moods.create(req.user.id, dto); }
  @Post('quest-complete') questComplete(@Req() req: AuthRequest) { return this.moods.completeQuest(req.user.id); }
}
