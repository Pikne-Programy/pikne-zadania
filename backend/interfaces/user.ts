// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RoleType } from "../types/mod.ts";

export interface IUser {
  readonly id: string;
  exists(): Promise<boolean>;
  readonly login: {
    get: () => Promise<string>;
    set: (value: string) => Promise<void>;
  };
  readonly name: {
    get: () => Promise<string>;
    set: (value: string) => Promise<void>;
  };
  readonly dhPassword: {
    get: () => Promise<string>;
    set: (value: string) => Promise<void>;
  };
  readonly team: {
    get: () => Promise<number>;
    set: (value: number) => Promise<void>;
  };
  readonly tokens: {
    exists: (value: string) => Promise<boolean>;
    add: (value: string) => Promise<void>;
    remove: (value: string) => Promise<void>;
  };
  readonly seed: {
    get: () => Promise<number | undefined>;
    set: (value: number) => Promise<void>;
  };
  readonly number: {
    get: () => Promise<number | undefined>;
    set: (value?: number) => Promise<void>;
  };
  readonly role: {
    get: () => Promise<string>;
    set: (value: RoleType) => Promise<void>;
  };
  readonly exercises: {
    get: (id: string) => Promise<number | undefined>;
    set: (id: string, value: number) => Promise<void>;
    add: (id: string, value: number) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
}
