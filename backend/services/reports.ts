// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  IConfigService,
  IReportsService,
  ITeamStore,
} from "../interfaces/mod.ts";
import { format, readCSV, writeCSV } from "../deps.ts";
import { ReportType } from "../types/mod.ts";

export class ReportsService implements IReportsService {
  constructor(
    private cfg: IConfigService,
    private ts: ITeamStore,
  ) {}

  async list() {
    const teams = await this.ts.list();
    const reports = teams.map((t) => t.reports).flat();
    return reports;
  }
  async get(path: string) {
    const report: ReportType = {};
    const exercises: string[] = [];
    let user = "";
    let rowNum = 0, colNum = 0;

    const options = {
      columnSeparator: ";",
      lineSeparator: "\n",
      quote: "$",
    };
    try {
      const f = await Deno.open(path);
      for await (const row of readCSV(f, options)) {
        colNum = 0;
        for await (const cell of row) {
          if (colNum !== 0 || rowNum !== 0) {
            if (rowNum === 0) exercises.push(cell);
            else if (colNum === 0) report[user = cell] = {};
            else report[user][exercises[colNum - 1]] = this.castCell(cell);
          }
          colNum++;
        }
        rowNum++;
      }
      f.close();
    } catch (e) {
      throw new Error(e); // TODO: Error message
    }
    return report;
  }

  async save(
    tid: number,
    report: ReportType,
  ) {
    let rows: string[][] = [];
    let exercises: string[] = [];
    for (const user in report) {
      rows.push([user]);
      for (const ex in report[user]) {
        const cell = report[user][ex]?.toString() ?? "null";
        rows[rows.length - 1].push(cell);
      }
      exercises = Object.keys(report[user]);
    }
    rows = [exercises, ...rows];

    const path = this.generateFileName(tid);
    try {
      const f = await Deno.open(path, {
        write: true,
        create: true,
        truncate: true,
      });
      await writeCSV(f, rows);
      f.close();
    } catch {
      throw new Error(); // TODO: Error message
    }
    const team = this.ts.get(tid);
    await team.reports.push(path);
    return path;
  }

  async delete(path: string) {
    const tid = this.getDataFromPath(path).tid;
    const team = this.ts.get(tid);
    await team.reports.pull(path);
    try {
      await Deno.remove(path);
    } catch {
      throw new Error(); // TODO: Error message
    }
  }

  private castCell(cell: string): number | null {
    if (cell === "null") return null;
    const val = +cell;
    if (isNaN(val)) throw new Error("Cell's value is naither number nor null");
    return val;
  }

  private generateFileName(teamId: number) {
    const datetime = format(new Date(), "yyyy-MM-ddTHH:mm:ss"); // TODO: current timezone
    const path = `${this.cfg.REPORTS_PATH}report_${teamId}_${datetime}.csv`;
    return path;
  }

  private getDataFromPath(path: string) {
    const re = /report_([1-9]+)_(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).csv/g;
    const parsed = re.exec(path);
    if (parsed === null || parsed?.length < 3) throw new Error(); // TODO error message
    const tid = +parsed[1];
    const datetime = parsed[2];
    return { tid, datetime };
  }
}
