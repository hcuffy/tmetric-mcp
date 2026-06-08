const BASE_URL = 'https://app.tmetric.com/api/v3';

function requireToken(): string {
    const t = process.env.TMETRIC_API_TOKEN;
    if (!t) {
        throw new Error(
            'TMETRIC_API_TOKEN is not set. Add it to your environment or MCP server env block.'
        );
    }

    return t;
}

export async function tmetricRequest<T>(
    method: string,
    path: string,
    body?: unknown
): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, { method,
        headers: { Authorization:  `Bearer ${requireToken()}`,
            'Content-Type': 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `TMetric ${method} ${path} → ${res.status} ${res.statusText}. ` +
        `Body: ${text || '(empty)'}. ` +
        'Check: token validity, accountId correctness, and date formats (YYYY-MM-DD / YYYY-MM-DDTHH:mm:ss).'
        );
    }

    if (res.status === 204) {
        return undefined as T;
    }

    return (await res.json()) as T;
}

let cachedAccountId: number | undefined;

/**
 * Resolve accountId. If explicit is provided, use it directly.
 * Otherwise resolve from GET /user (the user's first account membership).
 * Throws a descriptive error if multiple accounts are found and no explicit id given.
 */
export async function resolveAccountId(explicit?: number): Promise<number> {
    if (explicit !== undefined) {
        return explicit;
    }

    if (cachedAccountId !== undefined) {
        return cachedAccountId;
    }

    const user = await tmetricRequest<{
    activeAccountId?: number;
    accounts?: Array<{ id: number; name: string }>;
  }>('GET', '/user');

    if (user.activeAccountId) {
        cachedAccountId = user.activeAccountId;

        return cachedAccountId;
    }

    if (user.accounts && user.accounts.length === 1) {
        cachedAccountId = user.accounts[0].id;

        return cachedAccountId;
    }

    if (user.accounts && user.accounts.length > 1) {
        const list = user.accounts
            .map(a => `${a.id} (${a.name})`)
            .join(', ');
        throw new Error(
            `Multiple TMetric accounts found: ${list}. ` +
        'Pass an explicit accountId parameter to identify which account to use.'
        );
    }

    throw new Error(
        'Could not resolve accountId from GET /user response. ' +
      'Pass an explicit accountId parameter.'
    );
}

/** Clear the cached accountId (useful for testing or account switching). */
export function clearAccountIdCache(): void {
    cachedAccountId = undefined;
}

/** Validate token is present at startup — call this before connecting transport. */
export function validateTokenAtStartup(): void {
    requireToken();
}
