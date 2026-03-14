import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { StoreAccessGuard } from '../guards/store-access.guard.js';
import { Roles } from './roles.decorator.js';
import { UserRole } from '../constants.js';

/**
 * Restricts access to SUPER_ADMIN or STORE_ADMIN (STAFF is read-only).
 * Applies JwtAuthGuard, StoreAccessGuard, then RolesGuard in that order so
 * request.user is set before role check. Use on POST, PATCH, PUT, DELETE.
 */
export function RequireStoreManager() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, StoreAccessGuard, RolesGuard),
    Roles(UserRole.SUPER_ADMIN, UserRole.STORE_ADMIN),
  );
}
