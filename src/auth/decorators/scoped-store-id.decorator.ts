import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SCOPED_STORE_ID } from '../guards/store-access.guard.js';

/**
 * Injects the store-scoped store ID set by StoreAccessGuard.
 * Use after JwtAuthGuard + StoreAccessGuard. For STORE_ADMIN/STAFF this is their store_id;
 * for SUPER_ADMIN this is the requested storeId (if any) or undefined.
 */
export const ScopedStoreId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest();
  return request[SCOPED_STORE_ID];
});
