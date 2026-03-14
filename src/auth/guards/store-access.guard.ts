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
    const user = request.user as
      | { role: UserRole; store_id: string | null }
      | undefined;

    if (!user) {
      throw new ForbiddenException('GUARD_STORE_ACCESS_NO_USER');
    }

    const storeId =
      request.params?.storeId ??
      request.params?.store_id ??
      request.body?.store_id ??
      request.query?.store_id;

    if (user.role === UserRole.SUPER_ADMIN) {
      request[SCOPED_STORE_ID] = storeId ?? undefined;
      return true;
    }

    if (!storeId) {
      throw new ForbiddenException('GUARD_STORE_ACCESS_NO_STORE_ID');
    }
    if (user.store_id !== storeId) {
      throw new ForbiddenException('GUARD_STORE_ACCESS_STORE_MISMATCH');
    }
    request[SCOPED_STORE_ID] = user.store_id;
    return true;
  }
}
