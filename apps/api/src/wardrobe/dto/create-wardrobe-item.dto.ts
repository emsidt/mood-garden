import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, IsUrl, Length, Max, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClothingCategory, ClothingStyle } from '../../generated/prisma/enums';

export class CreateWardrobeItemDto {
  @ApiProperty({ example: 'Quần jeans relaxed' }) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @Length(1, 120) name!: string;
  @ApiProperty({ enum: ClothingCategory }) @IsEnum(ClothingCategory) category!: ClothingCategory;
  @ApiProperty({ example: 'Denim' }) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @Length(1, 40) color!: string;
  @ApiProperty({ enum: ClothingStyle }) @IsEnum(ClothingStyle) style!: ClothingStyle;
  @ApiProperty({ example: 16 }) @IsNumber() @Min(-20) @Max(60) minTemp!: number;
  @ApiProperty({ example: 30 }) @IsNumber() @Min(-20) @Max(60) maxTemp!: number;
  @ApiPropertyOptional() @ValidateIf((_o, value) => value !== undefined) @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @Length(1, 2048) purchaseUrl?: string;
  @ApiPropertyOptional() @ValidateIf((_o, value) => value !== undefined) @IsUrl({ protocols: ['http', 'https'], require_protocol: true }) @Length(1, 2048) imageUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() waterproof?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() windResistant?: boolean;
}

