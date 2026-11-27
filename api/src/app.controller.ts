import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/auth.decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Rota pública de verificação ("a API está no ar?")
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
