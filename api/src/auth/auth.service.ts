import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { normalizeEmail } from '../common/normalize';
import { hashPassword, verifyPassword } from '../common/password';
import { Role } from '../generated/prisma/client';
import { UsersService } from '../users/users.service';
import type { AuthUser, JwtPayload } from './auth.types';
import type { RegisterDto } from './dto/register.dto';

export interface Session {
  user: AuthUser;
  token: string;
}

/** Compara códigos sem diferenciar maiúsculas e em tempo constante. */
function sameCode(a: string, b: string): boolean {
  const digest = (s: string) =>
    createHash('sha256').update(s.trim().toLowerCase()).digest();
  return timingSafeEqual(digest(a), digest(b));
}

@Injectable()
export class AuthService {
  // Hash "falso" usado quando o e-mail não está cadastrado, para que a resposta
  // leve o mesmo tempo e não revele quais e-mails existem.
  private readonly dummyHash = hashPassword(randomBytes(16).toString('hex'));

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<Session> {
    const found = await this.users.findByEmailWithHash(normalizeEmail(email));

    const valid = await verifyPassword(
      password,
      found?.passwordHash ?? (await this.dummyHash),
    );
    if (!found || !valid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.createSession({
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      createdAt: found.createdAt,
    });
  }

  /**
   * Cadastro público com código de convite. Sem SIGNUP_CODE configurado,
   * o cadastro fica desativado. Quem se cadastra é sempre PLAYER e já
   * sai logado.
   */
  async register(dto: RegisterDto): Promise<Session> {
    const expected = this.config.get<string>('SIGNUP_CODE')?.trim();
    if (!expected) {
      throw new ForbiddenException('O cadastro está desativado');
    }
    // O código é checado ANTES do e-mail: sem o código certo, ninguém
    // consegue descobrir quais e-mails já estão cadastrados.
    if (!sameCode(dto.inviteCode, expected)) {
      throw new ForbiddenException('Código de convite inválido');
    }

    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: Role.PLAYER,
    });
    return this.createSession(user);
  }

  private async createSession(user: AuthUser): Promise<Session> {
    const payload: JwtPayload = { sub: user.id };
    return { user, token: await this.jwt.signAsync(payload) };
  }
}
