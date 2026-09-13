import { Body, Controller, Get, Header, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessGuard, AuthRequest } from '../auth/guards/access.guard';
import { UsersService } from './users.service';
import { UpdatePreferencesDto, UpdateUserDto } from './dto/update-user.dto';
@ApiTags('users') @ApiBearerAuth() @UseGuards(AccessGuard)
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() @Header('Cache-Control', 'no-store')
  me(@Req() req: AuthRequest) { return this.users.me(req.user.id); }
  @Patch()
  update(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) { return this.users.update(req.user.id, dto); }
  @Get('preferences') @Header('Cache-Control', 'no-store')
  preferences(@Req() req: AuthRequest) { return this.users.preferences(req.user.id); }
  @Patch('preferences')
  updatePreferences(@Req() req: AuthRequest, @Body() dto: UpdatePreferencesDto) {
    return this.users.updatePreferences(req.user.id, dto);
  }
}
