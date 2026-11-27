import type { Request } from 'express';
import type { PublicUser } from '../users/users.service';

export const SESSION_COOKIE = 'bolao_session';
// Sessão de 7 dias: cobre tranquilamente até o fim da cerimônia
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface JwtPayload {
  sub: string;
}

export type AuthUser = PublicUser;

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
