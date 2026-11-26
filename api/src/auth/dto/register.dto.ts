import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { toTrimmed } from '../../common/normalize';
import { UserFieldsDto } from '../../users/dto/create-user.dto';

/**
 * Cadastro público (POST /api/auth/register).
 * Não tem "role": quem se cadastra é sempre PLAYER. Enviar "role" no body
 * é recusado pelo ValidationPipe (forbidNonWhitelisted).
 */
export class RegisterDto extends UserFieldsDto {
  @Transform(toTrimmed)
  @IsString()
  @IsNotEmpty({ message: 'informe o código de convite' })
  @MaxLength(100)
  inviteCode!: string;
}
