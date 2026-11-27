import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface LockState {
  predictionsLockAt: Date | null;
  locked: boolean;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLockState(): Promise<LockState> {
    const settings = await this.prisma.settings.findUnique({
      where: { id: 1 },
    });
    const predictionsLockAt = settings?.predictionsLockAt ?? null;
    return {
      predictionsLockAt,
      // Sem horário definido = palpites abertos
      locked:
        predictionsLockAt !== null && Date.now() >= predictionsLockAt.getTime(),
    };
  }

  /** Lança 403 se os palpites já foram encerrados. */
  async assertPredictionsOpen(): Promise<void> {
    const { locked } = await this.getLockState();
    if (locked) {
      throw new ForbiddenException('Os palpites já foram encerrados');
    }
  }

  /** Lança 409 se os palpites ainda estão abertos (usado pelos resultados). */
  async assertPredictionsLocked(): Promise<void> {
    const { locked } = await this.getLockState();
    if (!locked) {
      throw new ConflictException(
        'Os vencedores só podem ser definidos depois que os palpites forem encerrados',
      );
    }
  }

  /**
   * Altera o horário de bloqueio (null = sem bloqueio).
   * Não permite reabrir os palpites se já houver vencedores definidos,
   * senão alguém poderia trocar o palpite sabendo o resultado.
   */
  async updateLockAt(predictionsLockAt: Date | null): Promise<LockState> {
    const wouldReopen =
      predictionsLockAt === null || predictionsLockAt.getTime() > Date.now();

    if (wouldReopen) {
      const winners = await this.prisma.category.count({
        where: { winnerNomineeId: { not: null } },
      });
      if (winners > 0) {
        throw new ConflictException(
          'Não é possível reabrir os palpites: já existem vencedores definidos',
        );
      }
    }

    await this.prisma.settings.upsert({
      where: { id: 1 },
      create: { id: 1, predictionsLockAt },
      update: { predictionsLockAt },
    });
    return this.getLockState();
  }
}
