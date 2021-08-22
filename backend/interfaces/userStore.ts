// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CustomDictError, RoleType } from "../types/mod.ts";
import { IConfigService, IDatabaseService, IUser } from "./mod.ts";
import { StoreTarget } from "../services/mod.ts";

export interface IUserStoreConstructor {
  new (
    cfg: IConfigService,
    db: IDatabaseService,
    parent: StoreTarget,
  ): IUserStore;
}

export interface IUserStore {
  init(): Promise<void>;
  add(
    where: { invitation: string },
    options: {
      login: string;
      name: string;
      number?: number;
      role?: RoleType;
      seed?: number;
    } & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<
    void | CustomDictError<"UserAlreadyExists" | "TeamInvitationNotFound">
  >;
  add(
    where: { teamId: number },
    options:
      & {
        login: string;
        name: string;
        number?: number;
        role?: RoleType;
        seed?: number;
      }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<
    | void
    | CustomDictError<"UserAlreadyExists" | "TeamNotFound">
  >;
  add(
    where: { invitation: string } | { teamId: number },
    options:
      & {
        login: string;
        name: string;
        number?: number;
        role?: RoleType;
        seed?: number;
      }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<
    | void
    | CustomDictError<
      "UserAlreadyExists" | "TeamNotFound" | "TeamInvitationNotFound"
    >
  >;
  get(id: string): IUser; // returns placeholder
  delete(id: string): Promise<void | CustomDictError<"UserNotFound">>;
}
