import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../constants.js';
import { ROLES_KEY } from '../constants.js';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
