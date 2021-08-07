// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TeamType } from "../types/mod.ts";
import { IConfigService, IDatabaseService, ITeam } from "./mod.ts";
import { StoreTarget } from "../services/mod.ts";

export type ITeamStoreConstructor = new (
  cfg: IConfigService,
  db: IDatabaseService,
  parent: StoreTarget,
) => ITeamStore;

export interface ITeamStore {
  init(): Promise<void>;
  list(): Promise<TeamType[]>;
  /** Returns:
   * - 1 if the team already exist,
   * - 2 if assignee doesn't exist.
   */
  add(
    id: number | null,
    options: { name: string; assignee: string },
  ): Promise<0 | 1 | 2>;
  get(id: number): ITeam;
  delete(id: number): Promise<void>; // throws
  invitation: {
    create: (id: number) => string;
    get: (inv: string) => Promise<number | null>;
  };
}
