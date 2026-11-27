import type { Request } from 'express';
import type { PublicUser } from '../users/users.service';

export const SESSION_COOKIE = 'bolao_session';
// Sessão de 7 dias: cobre tranquilamente até o fim da cerimônia
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface JwtPayload {
  sub: string;
  /** Emitido em (segundos), preenchido pelo JwtService ao assinar */
  iat?: number;
}

/**
 * true se a sessão foi emitida antes da última troca/redefinição de senha.
 * O iat tem precisão de segundos, então compara em segundos: uma sessão criada
 * no mesmo segundo da troca (a de quem acabou de trocar) continua valendo.
 */
export function isSessionRevoked(
  payload: JwtPayload,
  passwordChangedAt: Date | null,
): boolean {
  if (!passwordChangedAt) return false;
  if (payload.iat === undefined) return true;
  return payload.iat < Math.floor(passwordChangedAt.getTime() / 1000);
}

export type AuthUser = PublicUser;

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
