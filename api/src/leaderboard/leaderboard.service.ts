import { Injectable } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  points: number;
  hits: number;
  gotyHit: boolean;
  filled: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ranking calculado na hora (nada fica salvo, então nunca fica desatualizado).
   * Ordem: pontos (desc) → desempate: acertou o GOTY → nome (só para exibição).
   * Empatados em pontos e no desempate dividem a mesma posição (1, 1, 3...).
   */
  async get() {
    const [categories, players] = await Promise.all([
      this.prisma.category.findMany({
        select: { id: true, points: true, isGoty: true, winnerNomineeId: true },
      }),
      this.prisma.user.findMany({
        where: { role: Role.PLAYER },
        select: {
          id: true,
          name: true,
          predictions: { select: { categoryId: true, nomineeId: true } },
        },
      }),
    ]);

    const byId = new Map(categories.map((c) => [c.id, c]));

    const rows = players.map((player) => {
      let points = 0;
      let hits = 0;
      let gotyHit = false;
      for (const p of player.predictions) {
        const category = byId.get(p.categoryId);
        if (
          category?.winnerNomineeId &&
          category.winnerNomineeId === p.nomineeId
        ) {
          points += category.points;
          hits++;
          if (category.isGoty) gotyHit = true;
        }
      }
      return {
        userId: player.id,
        name: player.name,
        points,
        hits,
        gotyHit,
        filled: player.predictions.length,
      };
    });

    rows.sort(
      (a, b) =>
        b.points - a.points ||
        Number(b.gotyHit) - Number(a.gotyHit) ||
        a.name.localeCompare(b.name, 'pt-BR'),
    );

    let rank = 0;
    const ranked: LeaderboardRow[] = rows.map((row, i) => {
      const prev = rows[i - 1];
      if (!prev || prev.points !== row.points || prev.gotyHit !== row.gotyHit) {
        rank = i + 1;
      }
      return { rank, ...row };
    });

    return {
      totalCategories: categories.length,
      decidedCategories: categories.filter((c) => c.winnerNomineeId).length,
      gotyDecided: categories.some((c) => c.isGoty && c.winnerNomineeId),
      players: ranked,
    };
  }
}
