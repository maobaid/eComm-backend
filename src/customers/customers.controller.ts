import { Controller } from '@nestjs/common';
import { CustomersService } from './customers.service.js';

@Controller('stores/:storeId/customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}
}
