# Architecture Rules

1. Always filter queries by store_id except SUPER_ADMIN.
2. No cross-store data access allowed.
3. Controllers must stay thin.
4. Business logic must be in services.
5. Order creation must use Prisma transaction.
6. Address default must be enforced in service layer.
7. Validate all DTOs.
8. Index store_id in all tables.
9. Use pagination on list endpoints.
10. Never trust client-side price calculations.
