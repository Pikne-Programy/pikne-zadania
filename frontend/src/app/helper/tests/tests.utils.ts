export async function setAsyncTimeout(ms: number): Promise<void> {
    // eslint-disable-next-line no-promise-executor-return
    return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

export function getStringFromAny(
    obj: any,
    anyFallback: string,
    numberFallback?: string
): string {
    switch (typeof obj) {
        case 'string':
            return obj;
        case 'number':
            return numberFallback ?? anyFallback;
        default:
            return anyFallback;
    }
}
