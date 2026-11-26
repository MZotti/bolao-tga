import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { toNormalizedEmail, toTrimmed } from '../../common/normalize';
import { Role } from '../../generated/prisma/client';

export class CreateUserDto {
  @Transform(toTrimmed)
  @IsString()
  @Length(1, 50)
  name!: string;

  @Transform(toNormalizedEmail)
  @IsEmail({}, { message: 'email inválido' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
