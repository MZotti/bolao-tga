import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { hashPassword } from '../common/password';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

// Campos seguros para devolver na API (nunca o passwordHash)
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  mustChangePassword: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uso do AuthGuard: dados públicos + passwordChangedAt, para recusar
   * sessões emitidas antes da última troca de senha.
   */
  findForSession(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { ...publicUserSelect, passwordChangedAt: true },
    });
  }

  // Uso interno do login: inclui o hash da senha.
  // Espera o e-mail já normalizado (ver common/normalize.ts).
  findByEmailWithHash(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Uso interno da troca de senha: inclui o hash
  findByIdWithHash(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  /**
   * Grava uma nova senha e encerra as sessões abertas do usuário.
   * temporary = true: senha definida pelo admin, a pessoa terá que trocar.
   */
  async setPassword(
    id: string,
    password: string,
    { temporary }: { temporary: boolean },
  ): Promise<PublicUser> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          passwordHash: await hashPassword(password),
          mustChangePassword: temporary,
          passwordChangedAt: new Date(),
        },
        select: publicUserSelect,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Usuário não encontrado');
      }
      throw e;
    }
  }

  /** Altera nome e e-mail (e-mail já normalizado). */
  async updateProfile(
    id: string,
    data: { name: string; email: string },
  ): Promise<PublicUser> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: publicUserSelect,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new ConflictException('Este e-mail já está em uso');
        }
        if (e.code === 'P2025') {
          throw new NotFoundException('Usuário não encontrado');
        }
      }
      throw e;
    }
  }

  list(): Promise<PublicUser[]> {
    return this.prisma.user.findMany({
      select: publicUserSelect,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(
    dto: CreateUserDto,
    options: { temporaryPassword: boolean },
  ): Promise<PublicUser> {
    try {
      return await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: await hashPassword(dto.password),
          role: dto.role,
          // Senha escolhida pelo admin: a pessoa troca no primeiro login
          mustChangePassword: options.temporaryPassword,
        },
        select: publicUserSelect,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(`email "${dto.email}" já está cadastrado`);
      }
      throw e;
    }
  }
}
