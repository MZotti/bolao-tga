import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { SettingsModule } from '../settings/settings.module';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';

@Module({
  imports: [SettingsModule, CategoriesModule],
  controllers: [ResultsController],
  providers: [ResultsService],
})
export class ResultsModule {}
