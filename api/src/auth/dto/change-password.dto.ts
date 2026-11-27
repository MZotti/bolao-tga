import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Troca da própria senha (POST /api/auth/change-password). */
export class ChangePasswordDto {
  // Obrigatória, exceto logo após uma redefinição pelo admin (mustChangePassword):
  // nesse caso a pessoa acabou de entrar com a senha temporária.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  currentPassword?: string;

  @IsString()
  @MinLength(8, { message: 'a senha deve ter pelo menos 8 caracteres' })
  @MaxLength(200)
  newPassword!: string;
}
