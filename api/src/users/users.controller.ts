import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthUser } from '../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersService } from './users.service';

// Gestão de participantes: somente admin
@Roles(Role.ADMIN)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list() {
    return this.users.list();
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    // A senha foi escolhida pelo admin: a pessoa troca no primeiro login
    return this.users.create(dto, { temporaryPassword: true });
  }

  /**
   * Define uma senha temporária (ex.: alguém esqueceu a senha).
   * Encerra as sessões abertas da pessoa, e no próximo login ela
   * precisa escolher uma senha nova.
   */
  @Patch(':id/password')
  resetPassword(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    if (id === admin.id) {
      throw new BadRequestException(
        'Para trocar a sua própria senha, use "Alterar senha" no menu',
      );
    }
    return this.users.setPassword(id, dto.password, { temporary: true });
  }
}
