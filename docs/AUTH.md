# JWT Authentication

## Prisma schema (User + Store for auth)

Add these to `prisma/schema.prisma` if not already present:

```prisma
enum UserRole {
  SUPER_ADMIN
  STORE_ADMIN
  STAFF
}

model Store {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())
  users      User[]
}

model User {
  id            String   @id @default(uuid())
  store_id      String?
  name          String
  email         String   @unique
  password_hash String
  role          UserRole
  created_at    DateTime @default(now())
  store         Store?   @relation(fields: [store_id], references: [id], onDelete: SetNull)
  @@index([store_id])
  @@index([email])
}
```

Then run `npx prisma migrate dev` and `npx prisma generate`.

## Environment

- `JWT_SECRET` – used to sign tokens (default `changeme`; set in production).

## Endpoints

- **POST /auth/register** – body: `{ name, email, password, role, store_id? }`. `store_id` required for STORE_ADMIN/STAFF; must be omitted for SUPER_ADMIN.
- **POST /auth/login** – body: `{ email, password }`. Returns `{ access_token, user }`.
- **GET /auth/me** – requires `Authorization: Bearer <token>`. Returns current user payload.

## Guards and decorators

- **JwtAuthGuard** – requires valid JWT.
- **RolesGuard** – use with `@Roles(UserRole.STORE_ADMIN, UserRole.STAFF)` to restrict by role.
- **StoreAccessGuard** – store-scoped guard: users can only access data from their store unless SUPER_ADMIN. Resolves `storeId` from `params.storeId`, `params.store_id`, `body.store_id`, or `query.store_id`. Sets `request.scopedStoreId` for use in services (filter by `store_id`).
- **@CurrentUser()** – injects `{ id, email, role, store_id }` from the JWT.
- **@ScopedStoreId()** – injects the effective store ID set by StoreAccessGuard (use when filtering queries by `store_id`).

## Usage on store-scoped routes

```ts
@UseGuards(JwtAuthGuard, StoreAccessGuard)
@Get(':storeId')
getStore(@ScopedStoreId() storeId: string | undefined, @CurrentUser() user: CurrentUserPayload) {
  // SUPER_ADMIN: storeId from URL (or undefined). STORE_ADMIN/STAFF: storeId === user.store_id
  return this.storesService.findOne(storeId!);
}
```

In services, always filter by `store_id` except for SUPER_ADMIN; use the scoped store ID from the guard (passed from controller or via a request-scoped provider).

## Architecture rules

- Filter all queries by `store_id` except for SUPER_ADMIN (enforced in services).
- No cross-store data access for STORE_ADMIN and STAFF (StoreAccessGuard + service checks).
