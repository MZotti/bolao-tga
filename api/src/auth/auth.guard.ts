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
  isSessionRevoked,
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

    // Busca o usuário a cada requisição: se ele for removido, tiver a role
    // alterada ou a senha trocada, isso vale imediatamente (custo irrelevante
    // para 6 usuários).
    const found = await this.users.findForSession(payload.sub);
    if (!found || isSessionRevoked(payload, found.passwordChangedAt)) {
      throw new UnauthorizedException('Sessão inválida ou expirada');
    }

    // passwordChangedAt fica de fora: req.user é o que a API pode devolver
    req.user = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      mustChangePassword: found.mustChangePassword,
      createdAt: found.createdAt,
    };
    return true;
  }
}
