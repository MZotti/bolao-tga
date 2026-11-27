import {
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { Roles } from '../auth/auth.decorators';
import { Role } from '../generated/prisma/client';
import { SetWinnerDto } from './dto/set-winner.dto';
import { ResultsService } from './results.service';

// Marcação dos vencedores durante a cerimônia: somente admin
@Roles(Role.ADMIN)
@Controller('results')
export class ResultsController {
  constructor(private readonly results: ResultsService) {}

  @Put(':categoryId')
  setWinner(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: SetWinnerDto,
  ) {
    return this.results.setWinner(categoryId, dto.nomineeId);
  }

  @Delete(':categoryId')
  clearWinner(@Param('categoryId', ParseUUIDPipe) categoryId: string) {
    return this.results.clearWinner(categoryId);
  }
}
