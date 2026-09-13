import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'you@example.com or ten_cua_ban' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString() @Length(3, 254)
  identifier!: string;
  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString() @Length(10, 128)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'you@example.com' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254)
  email!: string;
  @ApiProperty({ minLength: 3, maxLength: 30 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @Matches(/^[a-z0-9_]{3,30}$/, { message: 'username must contain 3–30 letters, digits or underscores' })
  username!: string;
  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString() @Length(10, 128)
  password!: string;
}
