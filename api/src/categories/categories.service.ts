import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Categorias com indicados, vencedor (se já definido) e o palpite do usuário. */
  async listForUser(userId: string) {
    const categories = await this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        slug: true,
        name: true,
        points: true,
        isGoty: true,
        winnerNomineeId: true,
        nominees: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, subtitle: true, imageUrl: true },
        },
        predictions: {
          where: { userId },
          select: { nomineeId: true },
        },
      },
    });

    return categories.map(({ predictions, ...category }) => ({
      ...category,
      myNomineeId: predictions[0]?.nomineeId ?? null,
    }));
  }

  /** 404 se a categoria não existe. */
  async assertCategoryExists(categoryId: string): Promise<void> {
    const exists = await this.prisma.category.count({
      where: { id: categoryId },
    });
    if (!exists) throw new NotFoundException('Categoria não encontrada');
  }

  /**
   * 404 se a categoria não existe; 400 se o indicado não pertence a ela.
   * Usado por palpites e resultados.
   */
  async assertNomineeInCategory(
    categoryId: string,
    nomineeId: string,
  ): Promise<void> {
    const nominee = await this.prisma.nominee.findFirst({
      where: { id: nomineeId, categoryId },
      select: { id: true },
    });
    if (nominee) return;

    await this.assertCategoryExists(categoryId);
    throw new BadRequestException('Este indicado não pertence à categoria');
  }
}
