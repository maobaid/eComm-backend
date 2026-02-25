import { Controller } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';

@Controller('stores/:storeId/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}
}
