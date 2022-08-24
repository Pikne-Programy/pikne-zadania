import { Component } from '@angular/core';

@Component({
    template: ''
})
export class TestComponent {
    constructor() {}
}

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

export class Params {
    constructor(
        private entries: [key: string, value: string][],
        private timeout: number = 20
    ) {}

    subscribe: (next: (params: Map<string, string>) => void) => Subscription = (
        next
    ) => {
        setTimeout(() => {
            const map = new Map<string, string>();
            for (const [key, value] of this.entries) map.set(key, value);
            next(map);
        }, this.timeout);
        return new Subscription();
    };
}

export class Subscription {
    unsubscribe() {}
}
