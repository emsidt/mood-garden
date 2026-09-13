import { Transform } from 'class-transformer';
import { IsEnum, IsNumber, IsString, Length, Matches, Max, Min, ValidateIf, registerDecorator } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ClothingStyle } from '../../generated/prisma/enums';
export class UpdateUserDto {
  @ApiPropertyOptional() @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @Matches(/^[a-z0-9_]{3,30}$/)
  username?: string;
}
function IsTimezone() {
  return (object: object, propertyName: string) => registerDecorator({
    name: 'isTimezone', target: object.constructor, propertyName,
    options: { message: 'timezone must be a valid IANA timezone' },
    validator: { validate(value: unknown) {
      if (typeof value !== 'string' || value.length > 100) return false;
      try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); return true; } catch { return false; }
    } },
  });
}
export class UpdatePreferencesDto {
  @ApiPropertyOptional() @ValidateIf((_o, v) => v !== undefined)
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @Length(1, 100)
  city?: string;
  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' }) @ValidateIf((_o, v) => v !== undefined)
  @IsTimezone()
  timezone?: string;
  @ApiPropertyOptional({ enum: ClothingStyle }) @ValidateIf((_o, v) => v !== undefined)
  @IsEnum(ClothingStyle)
  preferredStyle?: ClothingStyle;
  @ApiPropertyOptional({ minimum: -10, maximum: 10 }) @ValidateIf((_o, v) => v !== undefined)
  @IsNumber() @Min(-10) @Max(10)
  temperatureTolerance?: number;
}
