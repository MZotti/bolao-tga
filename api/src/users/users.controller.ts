import { Body, Controller, Get, Post } from '@nestjs/common';
import { Role } from '../generated/prisma/client';
import { Roles } from '../auth/auth.decorators';
import { CreateUserDto } from './dto/create-user.dto';
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
    return this.users.create(dto);
  }
}
