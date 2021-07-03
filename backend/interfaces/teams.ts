// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { UserType } from "../types/mod.ts";

export interface ITeams {
  getAllOf(
    user: UserType,
  ): Promise<{ id: number; name: string; assignee: string; open: boolean }[]>;
  add(name: string, assignee: UserType): Promise<number | null>;
  delete(id: number): Promise<boolean>;
  get(id: number): Promise<
    {
      name: string;
      assignee: string;
      invitation: string | null;
      members: { id: string; name: string; number: number | null }[];
    } | null
  >;
  /** Returns:
  * - 1 if team was not found,
  * - 2 if assignee was not found.
  */
  update(
    id: number,
    invitation?: string,
    assignee?: string,
    name?: string,
  ): Promise<0 | 1 | 2>;
}
