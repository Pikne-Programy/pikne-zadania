// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { browserCrypto, MersenneTwister19937, Random } from "../deps.ts";

function precision(a: number) {
  // SRC: https://stackoverflow.com/a/27865285/6732111
  if (!isFinite(a)) {
    return 0;
  }

  let e = 1;
  let p = 0;

  while (Math.round(a * e) / e !== a) {
    e *= 10;
    p++;
  }

  return p;
}

export const generateSeed = () => new Random(browserCrypto).int32();

export class RNG {
  readonly rng: Random;

  constructor(readonly seed: number, readonly prec: number) {
    this.rng = new Random(MersenneTwister19937.seed(seed));
  }

  rand(min: number, max: number, step?: number): number {
    const guess = this.rng.real(min, max, true);

    if (step) {
      // it's not usable if it's 0
      const guessStepped = +(min + Math.round((guess - min) / step) * step);
      return +guessStepped.toFixed(precision(step));
    }

    return +guess.toPrecision(this.prec);
  }
}

export class Range {
  constructor(
    readonly min: number,
    readonly max: number,
    readonly step?: number,
  ) {}

  rand(rng: RNG): number {
    return rng.rand(this.min, this.max, this.step);
  }
}
