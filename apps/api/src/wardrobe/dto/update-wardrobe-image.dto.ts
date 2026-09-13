import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, Length } from 'class-validator';

export class UpdateWardrobeImageDto {
  @ApiProperty({ example: 'https://example.com/trousers.jpg' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @Length(1, 2048)
  imageUrl!: string;
}
