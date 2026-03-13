import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '../constants.js';

/** Name of the request property set by this guard for use in services (effective store scope). */
export const SCOPED_STORE_ID = 'scopedStoreId';

/**
 * Store-scoped guard: users can only access data from their store unless SUPER_ADMIN.
 * - SUPER_ADMIN: can access any store; request may include a storeId to scope the operation.
 * - STORE_ADMIN / STAFF: can only access their own store; storeId from request must match user.store_id.
 *
 * Resolves storeId from (in order): params.storeId, params.store_id, body.store_id, query.store_id.
 * Sets request[SCOPED_STORE_ID] so services can filter queries by store_id (see ARCHITECTURE_RULES).
 */
@Injectable()
export class StoreAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    console.log('[StoreAccessGuard] canActivate', request.method, request.path);
    const user = request.user as
      | { role: UserRole; store_id: string | null }
      | undefined;

    if (!user) {
      console.log('[StoreAccessGuard] DENY: no user on request', {
        method: request.method,
        path: request.path,
      });
      return false;
    }

    const storeId =
      request.params?.storeId ??
      request.params?.store_id ??
      request.body?.store_id ??
      request.query?.store_id;

    console.log('[StoreAccessGuard]', {
      path: request.path,
      method: request.method,
      user,
      storeId,
    });

    if (user.role === UserRole.STORE_ADMIN) {
      request[SCOPED_STORE_ID] = storeId ?? undefined;
      return true;
    }

    if (!storeId) {
      console.log('[StoreAccessGuard] DENY: store context required', {
        path: request.path,
      });
      throw new ForbiddenException('Store context required');
    }
    if (user.store_id !== storeId) {
      console.log('[StoreAccessGuard] DENY: store mismatch', {
        path: request.path,
        userStoreId: user.store_id,
        requestStoreId: storeId,
      });
      throw new ForbiddenException('Access denied to this store');
    }
    request[SCOPED_STORE_ID] = user.store_id;
    return true;
  }
}
