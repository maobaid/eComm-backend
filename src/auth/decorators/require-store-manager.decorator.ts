import { applyDecorators, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from './roles.decorator.js';
import { UserRole } from '../constants.js';

/**
 * Restricts access to SUPER_ADMIN or STORE_ADMIN (STAFF is read-only).
 * Use on POST, PATCH, PUT, DELETE. Omit on GET so STAFF can read.
 */
export function RequireStoreManager() {
  return applyDecorators(
    UseGuards(RolesGuard),
    Roles(UserRole.SUPER_ADMIN, UserRole.STORE_ADMIN),
  );
}
