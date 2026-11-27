import { IsString, MaxLength, MinLength } from 'class-validator';

/** Redefinição pelo admin (PATCH /api/users/:id/password). */
export class ResetPasswordDto {
  // Senha temporária: a pessoa entra com ela e escolhe uma nova
  @IsString()
  @MinLength(8, { message: 'a senha deve ter pelo menos 8 caracteres' })
  @MaxLength(200)
  password!: string;
}
