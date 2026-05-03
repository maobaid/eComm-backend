import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  CUSTOMIZATION_ALLOWED_MIMES,
  CUSTOMIZATION_IMAGE_MAX_BYTES,
  MIME_TO_EXT,
} from './constants.js';
import { sniffImageMime } from './image-sniff.js';
import type { MemoryStoredUploadFile } from './memory-upload-file.types.js';

/** Pre–store-creation logo uploads (e.g. register-store `logo_url`). No `storeId` required. */
@Injectable()
export class StoreLogoUploadService {
  private readonly logger = new Logger(StoreLogoUploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async uploadLogo(file?: MemoryStoredUploadFile): Promise<{ url: string }> {
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

    const publicBaseUrl = this.configService.get<string>('STORE_LOGO_UPLOAD_PUBLIC_BASE_URL');
    if (!publicBaseUrl?.trim()) {
      throw new BadRequestException(
        'STORE_LOGO_UPLOAD_PUBLIC_BASE_URL is not configured (needed to return reachable logo URLs)',
      );
    }

    const uploadRoot = path.resolve(
      this.configService.get<string>('STORE_LOGO_UPLOAD_DIR') ?? './storage/store-logo-uploads',
    );

    const ext = MIME_TO_EXT[file.mimetype] ?? '';
    const fileName = `${randomUUID()}${ext}`;
    await mkdir(uploadRoot, { recursive: true });
    const diskPath = path.join(uploadRoot, fileName);
    await writeFile(diskPath, file.buffer);

    const urlBase = publicBaseUrl.replace(/\/$/, '');
    const url = `${urlBase}/${encodeURIComponent(fileName)}`;
    this.logger.log(`Store logo (pre-registration) saved ${diskPath}`);
    return { url };
  }
}
