// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

//FIXME this is unused, ask why
export class Lock {
  last = Promise.resolve();

  resolver?: () => void;
  acquire(): Promise<void> {
    let resolver: () => void;
    const { last } = this;

    this.last = new Promise<void>((r) => {
      resolver = r;
    });

    last.then(() => {
      this.resolver = resolver;
    });

    return last;
  }
  release() {
    this.resolver?.();
  }
}

export class Padlock {
  // see Mutex
  readonly key = Symbol();
  lock = new Lock();

  async get() {
    await this.lock.acquire();
    return this.key;
  }
  release() {
    this.lock.release();
  }
  check(key: unknown) {
    return key === this.key;
  }
}
