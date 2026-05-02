import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CustomizationImageUploadController } from './customization-image-upload.controller.js';
import { CustomizationImageUploadService } from './customization-image-upload.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CustomizationImageUploadController],
  providers: [CustomizationImageUploadService],
})
export class UploadsModule {}
