export const ADMIN_ROLES = ['owner', 'admin', 'staff'] as const;
export type AccountRole = 'customer' | (typeof ADMIN_ROLES)[number];

export function safeNextPath(value: string | null | undefined, fallback = '/account/') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  try {
    const parsed = new URL(value, 'https://caseclan.local');
    return parsed.origin === 'https://caseclan.local' ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback;
  } catch {
    return fallback;
  }
}

export function loginHref(next: string) {
  return `/login/?next=${encodeURIComponent(safeNextPath(next, '/'))}`;
}

export function isAdminRole(role: string | null | undefined): role is (typeof ADMIN_ROLES)[number] {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}
