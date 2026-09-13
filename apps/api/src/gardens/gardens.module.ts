import { Module } from '@nestjs/common';
import { GardensService } from './gardens.service';
import { GardensController } from './gardens.controller';
import { AuthModule } from '../auth/auth.module';
@Module({ imports: [AuthModule], controllers: [GardensController], providers: [GardensService], exports: [GardensService] })
export class GardensModule {}
