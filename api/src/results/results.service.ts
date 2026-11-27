import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

const resultSelect = {
  id: true,
  slug: true,
  name: true,
  winnerNomineeId: true,
} as const;

@Injectable()
export class ResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly categories: CategoriesService,
  ) {}

  /** Define (ou troca) o vencedor de uma categoria. */
  async setWinner(categoryId: string, nomineeId: string) {
    // Com os palpites abertos, revelar um vencedor permitiria trocar o palpite
    await this.settings.assertPredictionsLocked();
    await this.categories.assertNomineeInCategory(categoryId, nomineeId);

    return this.prisma.category.update({
      where: { id: categoryId },
      data: { winnerNomineeId: nomineeId },
      select: resultSelect,
    });
  }

  /** Desfaz o vencedor (ex.: marcado por engano). */
  async clearWinner(categoryId: string) {
    await this.categories.assertCategoryExists(categoryId);
    return this.prisma.category.update({
      where: { id: categoryId },
      data: { winnerNomineeId: null },
      select: resultSelect,
    });
  }
}
