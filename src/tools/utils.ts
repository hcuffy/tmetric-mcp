export function result(data: unknown) {
    return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
}

export function errorResult(err: unknown) {
    return { content: [{ type: 'text' as const, text: String(err) }],
        isError: true as const };
}

export async function safe<T>(fn: () => Promise<T>): Promise<T | ReturnType<typeof errorResult>> {
    try {
        return await fn();
    } catch (err) {
        return errorResult(err);
    }
}
