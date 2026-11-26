import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { Role } from '../generated/prisma/client';
import { UpsertPredictionDto } from './dto/upsert-prediction.dto';
import { PredictionsService } from './predictions.service';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictions: PredictionsService) {}

  /** Palpites de todos os participantes (somente após o encerramento). */
  @Get()
  listAll() {
    return this.predictions.listAll();
  }

  /** Progresso de preenchimento de cada participante. */
  @Get('progress')
  progress() {
    return this.predictions.progress();
  }

  @Roles(Role.PLAYER)
  @Put(':categoryId')
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpsertPredictionDto,
  ) {
    return this.predictions.upsert(user.id, categoryId, dto.nomineeId);
  }

  @Roles(Role.PLAYER)
  @Delete(':categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.predictions.remove(user.id, categoryId);
  }
}
