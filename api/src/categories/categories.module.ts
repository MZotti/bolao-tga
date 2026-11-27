import { Module } from '@nestjs/common';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { NomineesController } from './nominees.controller';

@Module({
  controllers: [CategoriesController, NomineesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
