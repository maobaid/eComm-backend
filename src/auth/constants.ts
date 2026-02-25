/** Role hierarchy: SUPER_ADMIN can access all stores; STORE_ADMIN and STAFF are scoped to store_id */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  STORE_ADMIN = 'STORE_ADMIN',
  STAFF = 'STAFF',
}

export const ROLES_KEY = 'roles';
