import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Roles } from '../auth/auth.decorators';
import { Role } from '../generated/prisma/client';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { LockState, SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  async get() {
    return this.withServerTime(await this.settings.getLockState());
  }

  @Roles(Role.ADMIN)
  @Patch()
  async update(@Body() dto: UpdateSettingsDto) {
    const lockAt =
      dto.predictionsLockAt === null ? null : new Date(dto.predictionsLockAt);
    return this.withServerTime(await this.settings.updateLockAt(lockAt));
  }

  // serverTime permite ao front calcular a contagem regressiva
  // sem depender do relógio do celular de cada participante
  private withServerTime(lock: LockState) {
    return { ...lock, serverTime: new Date() };
  }
}
