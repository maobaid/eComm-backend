import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CUSTOMIZATION_ALLOWED_MIMES,
  CUSTOMIZATION_IMAGE_MAX_BYTES,
  MIME_TO_EXT,
} from './constants.js';
import { sniffImageMime } from './image-sniff.js';

const storeFind = (prisma: PrismaService) => (prisma as any).store;

@Injectable()
export class CustomizationImageUploadService {
  private readonly logger = new Logger(CustomizationImageUploadService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async uploadImage(storeId: string, file?: Express.Multer.File): Promise<{ url: string }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('File is required (field name: file)');
    }
    if (file.size > CUSTOMIZATION_IMAGE_MAX_BYTES) {
      throw new BadRequestException(`File too large (max ${CUSTOMIZATION_IMAGE_MAX_BYTES} bytes)`);
    }
    if (!CUSTOMIZATION_ALLOWED_MIMES.includes(file.mimetype as (typeof CUSTOMIZATION_ALLOWED_MIMES)[number])) {
      throw new BadRequestException(
        `Invalid image type. Allowed: ${CUSTOMIZATION_ALLOWED_MIMES.join(', ')}`,
      );
    }

    const sniffed = sniffImageMime(file.buffer);
    if (!sniffed || sniffed !== file.mimetype) {
      throw new BadRequestException('File content does not match image type (possible spoofed MIME type)');
    }

    const storeRecord = await storeFind(this.prisma).findFirst({
      where: { id: storeId },
    });
    if (!storeRecord) throw new NotFoundException('Store not found');
    if (!storeRecord.is_active) throw new BadRequestException('Store is inactive');

    const publicBaseUrl = this.configService.get<string>('CUSTOMIZATION_UPLOAD_PUBLIC_BASE_URL');
    if (!publicBaseUrl?.trim()) {
      throw new BadRequestException(
        'CUSTOMIZATION_UPLOAD_PUBLIC_BASE_URL is not configured (needed to return reachable image URLs)',
      );
    }

    const uploadRoot = path.resolve(
      this.configService.get<string>('CUSTOMIZATION_UPLOAD_DIR') ??
        './storage/customization-uploads',
    );

    const ext = MIME_TO_EXT[file.mimetype] ?? '';
    const fileName = `${randomUUID()}${ext}`;
    const storeDir = path.join(uploadRoot, storeId);
    await mkdir(storeDir, { recursive: true });
    const diskPath = path.join(storeDir, fileName);
    await writeFile(diskPath, file.buffer);

    const urlBase = publicBaseUrl.replace(/\/$/, '');
    const url = `${urlBase}/${encodeURIComponent(storeId)}/${encodeURIComponent(fileName)}`;
    this.logger.log(`Customization image saved ${diskPath}`);
    return { url };
  }
}
