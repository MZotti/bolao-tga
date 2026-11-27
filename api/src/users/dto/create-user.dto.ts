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

/** Campos comuns a qualquer criação de usuário (admin ou cadastro público). */
export class UserFieldsDto {
  @Transform(toTrimmed)
  @IsString()
  @Length(1, 50)
  name!: string;

  @Transform(toNormalizedEmail)
  @IsEmail({}, { message: 'email inválido' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8, { message: 'a senha deve ter pelo menos 8 caracteres' })
  @MaxLength(200)
  password!: string;
}

/** Criação pelo admin (POST /api/users): pode escolher a role. */
export class CreateUserDto extends UserFieldsDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
