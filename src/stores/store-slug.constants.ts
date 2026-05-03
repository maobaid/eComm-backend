/** Same rules as Prisma unique `Store.slug` + create/register DTOs (lowercase URL segment). */
export const STORE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STORE_SLUG_MAX_LENGTH = 100;

export function isValidStoreSlug(raw: string): boolean {
  const slug = raw.trim();
  return (
    slug.length > 0 &&
    slug.length <= STORE_SLUG_MAX_LENGTH &&
    STORE_SLUG_REGEX.test(slug)
  );
}
