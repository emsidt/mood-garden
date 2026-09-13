import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Mood } from '../../generated/prisma/enums';
export class CreateMoodDto {
  @ApiProperty({ enum: Mood }) @IsEnum(Mood) mood!: Mood;
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() || undefined : value)
  @IsString() @MaxLength(500) note?: string;
}
