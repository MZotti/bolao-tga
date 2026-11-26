import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './auth.decorators';
import {
  type AuthenticatedRequest,
  type JwtPayload,
  SESSION_COOKIE,
} from './auth.types';

/**
 * Guard global: exige um cookie de sessão válido em todas as rotas,
 * exceto as marcadas com @Public().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Faça login para continuar');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    // Busca o usuário a cada requisição: se ele for removido ou tiver a role
    // alterada, isso vale imediatamente (custo irrelevante para 6 usuários).
    const user = await this.users.findPublicById(payload.sub);
    if (!user) throw new UnauthorizedException('Sessão inválida ou expirada');

    req.user = user;
    return true;
  }
}
