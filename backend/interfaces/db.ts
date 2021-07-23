// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Collection } from "../deps.ts";
import { TeamType, UserType } from "../types/db.ts";

export interface IDatabaseService {
  users?: Collection<UserType>;
  teams?: Collection<TeamType>;
  close(): void;
}
