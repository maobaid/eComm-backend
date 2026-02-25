import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(storeId: string) {
    return (this.prisma as any).store.findUniqueOrThrow({ where: { id: storeId } });
  }
}
