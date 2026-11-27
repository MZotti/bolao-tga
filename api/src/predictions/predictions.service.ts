import { ForbiddenException, Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class PredictionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly categories: CategoriesService,
  ) {}

  /** Cria ou troca o palpite do usuário numa categoria. */
  async upsert(userId: string, categoryId: string, nomineeId: string) {
    await this.settings.assertPredictionsOpen();

    // Mensagens claras para o front. A FK composta no banco continua
    // garantindo a regra mesmo que esta checagem seja contornada.
    await this.categories.assertNomineeInCategory(categoryId, nomineeId);

    return this.prisma.prediction.upsert({
      where: { userId_categoryId: { userId, categoryId } },
      create: { userId, categoryId, nomineeId },
      update: { nomineeId },
      select: { categoryId: true, nomineeId: true, updatedAt: true },
    });
  }

  /** Remove o palpite do usuário numa categoria (se existir). */
  async remove(userId: string, categoryId: string): Promise<void> {
    await this.settings.assertPredictionsOpen();
    await this.prisma.prediction.deleteMany({ where: { userId, categoryId } });
  }

  /** Palpites de todos: só liberado depois do encerramento. */
  async listAll() {
    const { locked } = await this.settings.getLockState();
    if (!locked) {
      throw new ForbiddenException(
        'Os palpites dos participantes ficam visíveis após o encerramento',
      );
    }

    return this.prisma.prediction.findMany({
      select: {
        categoryId: true,
        nomineeId: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { user: { name: 'asc' } }],
    });
  }

  /** Quantas categorias cada participante já preencheu (sem revelar as escolhas). */
  async progress() {
    const [total, players] = await Promise.all([
      this.prisma.category.count(),
      this.prisma.user.findMany({
        where: { role: Role.PLAYER },
        select: {
          id: true,
          name: true,
          _count: { select: { predictions: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    return players.map((p) => ({
      userId: p.id,
      name: p.name,
      filled: p._count.predictions,
      total,
    }));
  }
}
