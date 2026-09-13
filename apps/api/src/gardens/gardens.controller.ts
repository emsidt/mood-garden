import { Controller, Get, Header, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, AuthRequest } from '../auth/guards/access.guard';
import { GardensService } from './gardens.service';
@ApiTags('garden') @ApiBearerAuth() @UseGuards(AccessGuard) @Controller('garden')
export class GardensController {
  constructor(private readonly gardens: GardensService) {}
  @Get() @Header('Cache-Control', 'no-store') mine(@Req() req: AuthRequest) { return this.gardens.mine(req.user.id); }
  @Get('catalog') catalog() { return this.gardens.catalog(); }
}
