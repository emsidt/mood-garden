import { Module } from '@nestjs/common';
import { OutfitsService } from './outfits.service';

@Module({ providers: [OutfitsService], exports: [OutfitsService] })
export class OutfitsModule {}
