// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { IdOptional, IdRequired, TeamType } from "../types/mod.ts";

export interface ITeam {
  getAll(lock?: symbol): Promise<TeamType[]>;
  add(team: IdOptional<TeamType>, lock?: symbol): Promise<number | null>;
  delete(id: number, lock?: symbol): Promise<boolean>;
  get(id: number, lock?: symbol): Promise<TeamType | null>;
  set(part: IdRequired<TeamType>, lock?: symbol): Promise<boolean>;
  removeUser(id: number, uid: string, lock?: symbol): Promise<boolean>;
  addUser(id: number, uid: string, lock?: symbol): Promise<boolean>;
  getInvitation(invitation: string, lock?: symbol): Promise<number | null>;
  setInvitationCode(
    id: number,
    invitation: string | null,
    lock?: symbol,
  ): Promise<boolean>;
}
