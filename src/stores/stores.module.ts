import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';
import { StoreThemeSuggestionService } from './store-theme-suggestion.service.js';

@Module({
  controllers: [StoresController],
  providers: [StoresService, StoreThemeSuggestionService],
  exports: [StoresService],
})
export class StoresModule {}
