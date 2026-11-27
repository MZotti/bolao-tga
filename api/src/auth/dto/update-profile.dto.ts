import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { toNormalizedEmail, toTrimmed } from '../../common/normalize';

/**
 * Alteração dos próprios dados (PATCH /api/auth/me).
 * Mesmas regras de nome e e-mail do cadastro (ver UserFieldsDto).
 */
export class UpdateProfileDto {
  @Transform(toTrimmed)
  @IsString()
  @Length(1, 50)
  name!: string;

  @Transform(toNormalizedEmail)
  @IsEmail({}, { message: 'email inválido' })
  @MaxLength(254)
  email!: string;

  // Obrigatória só quando o e-mail muda: ele é o login da conta, então quem
  // estiver com uma sessão aberta alheia não consegue tomar a conta
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;
}
