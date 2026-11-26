import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { CurrentUser, Public } from './auth.decorators';
import { AuthService } from './auth.service';
import {
  type AuthUser,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
} from './auth.types';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  private readonly cookieBase: CookieOptions;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.cookieBase = {
      httpOnly: true,
      sameSite: 'lax',
      // Em produção o site é HTTPS (Caddy), então o cookie só trafega cifrado
      secure: config.get('NODE_ENV') === 'production',
      path: '/',
    };
  }

  @Public()
  // Limita tentativas de login por IP (ver ThrottlerModule no AuthModule)
  @UseGuards(ThrottlerGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthUser> {
    const { user, token } = await this.auth.login(dto.email, dto.password);
    res.cookie(SESSION_COOKIE, token, {
      ...this.cookieBase,
      maxAge: SESSION_TTL_SECONDS * 1000,
    });
    return user;
  }

  // Público para sempre conseguir limpar o cookie, mesmo com sessão expirada
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) res: Response): void {
    res.clearCookie(SESSION_COOKIE, this.cookieBase);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
