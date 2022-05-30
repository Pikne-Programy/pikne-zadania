// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export class Team {
  id!: number;
  name!: string;
  assignee!: string;
  members!: string[];
  invitation?: string;
}
