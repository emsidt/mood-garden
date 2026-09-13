import { PartialType } from '@nestjs/swagger';
import { CreateWardrobeItemDto } from './create-wardrobe-item.dto';

export class UpdateWardrobeItemDto extends PartialType(CreateWardrobeItemDto) {}
