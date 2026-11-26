import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toNormalizedEmail } from '../../common/normalize';

export class LoginDto {
  // Sem @IsEmail de propósito: um e-mail malformado recebe o mesmo
  // "e-mail ou senha inválidos" de qualquer outra tentativa errada.
  @Transform(toNormalizedEmail)
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password!: string;
}
