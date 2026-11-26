import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { normalizeEmail } from '../common/normalize';
import { hashPassword, verifyPassword } from '../common/password';
import { UsersService } from '../users/users.service';
import type { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  // Hash "falso" usado quando o e-mail não está cadastrado, para que a resposta
  // leve o mesmo tempo e não revele quais e-mails existem.
  private readonly dummyHash = hashPassword(randomBytes(16).toString('hex'));

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ user: AuthUser; token: string }> {
    const found = await this.users.findByEmailWithHash(normalizeEmail(email));

    const valid = await verifyPassword(
      password,
      found?.passwordHash ?? (await this.dummyHash),
    );
    if (!found || !valid) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const payload: JwtPayload = { sub: found.id };
    const token = await this.jwt.signAsync(payload);

    const user: AuthUser = {
      id: found.id,
      name: found.name,
      email: found.email,
      role: found.role,
      createdAt: found.createdAt,
    };
    return { user, token };
  }
}
