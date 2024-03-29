// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { ReportType } from "../types/mod.ts";

export interface IReportsService {
  list(): Promise<string[]>;
  save(
    tid: number,
    report: ReportType,
  ): Promise<string>;
  get(
    path: string,
  ): Promise<ReportType>;
  getRaw(path: string): string;
  delete(path: string): Promise<void>;
  getDataFromFilename(
    filename: string,
  ): { tid: number | null; datetime: string | null };
}
