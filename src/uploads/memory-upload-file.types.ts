/**
 * Narrow shape from multer MemoryStorage (Nest {@link FileInterceptor}).
 * Use this instead of `Express.Multer.File`: `@types/express` v5 does not expose `Multer`.
 */
export type MemoryStoredUploadFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};
