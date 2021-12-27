// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

export class Subject {
  constructor(data: Subject) {
    Object.assign(this, data);
  }
  id!: string;
  assignees!: string[] | null;
}
