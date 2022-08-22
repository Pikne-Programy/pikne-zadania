// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  IConfigService,
  IReportsService,
  ITeamStore,
  IUserStore,
} from "../interfaces/mod.ts";
import { format, readCSV, writeCSV } from "../deps.ts";
import { ReportType } from "../types/mod.ts";
import { joinThrowable } from "../utils/mod.ts";

export class ReportsService implements IReportsService {
  constructor(
    private cfg: IConfigService,
    private us: IUserStore,
    private ts: ITeamStore,
  ) {}

  async list() {
    const teams = await this.ts.list();
    const reports = teams.map((t) => t.reports).flat();
    return reports;
  }
  async get(filename: string) {
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
      const path = this.getReportPath(filename);
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

  getRaw(path: string) {
    return Deno.readTextFileSync(path);
  }

  async save(
    tid: number,
    report: ReportType,
  ) {
    let rows: string[][] = [];
    const exercises: string[] = await this.ts.get(tid).session.exercises.get();
    const ustats = ["Niezrobione", "Źle", "Częściowo", "Dobrze"];

    for (const uid in report) {
      const user = this.us.get(uid);
      rows.push([
        await user.name.get(),
        (await user.number.get() ?? "").toString(),
      ]);
      for (const ex in report[uid]) {
        const cell = report[uid][ex]?.toString() ?? "null";
        rows[rows.length - 1].push(cell);
      }

      const uex = Object.keys(report[uid]);
      const incorrect = uex.filter((k) => report[uid][k] == 0).length;
      const correct = uex.filter((k) => report[uid][k] == 1).length;
      const partial = uex.length - incorrect - correct;
      const unattempted = exercises.length - incorrect - correct - partial;
      for (const x of [unattempted, incorrect, partial, correct]) {
        rows[rows.length - 1].push(x.toString());
      }
    }
    const headers = ["No.", "Imię", ...exercises, ...ustats];
    rows = [headers, ...rows];
    console.log(rows);

    const filename = this.generateFileName(tid);
    const path = this.getReportPath(filename);
    try {
      const f = await Deno.open(path, {
        write: true,
        create: true,
        truncate: true,
      });
      await writeCSV(f, rows);
      f.close();
    } catch (e) {
      throw new Error(e);
    }
    const team = this.ts.get(tid);
    await team.reports.push(filename);
    return filename;
  }

  async delete(filename: string) {
    const tid = this.getDataFromFilename(filename).tid;
    if (tid === null) throw new Error(); // TODO: Error message
    const team = this.ts.get(tid);
    await team.reports.pull(filename);
    try {
      const path = this.getReportPath(filename);
      await Deno.remove(path);
    } catch {
      throw new Error(); // TODO: Error message
    }
  }

  getDataFromFilename(filename: string) {
    const re = /report_([0-9]+)_(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}).csv/g;
    const parsed = re.exec(filename);
    if (parsed === null || parsed?.length < 3) {
      return { tid: null, datetime: null };
    }
    const tid = +parsed[1];
    const datetime = parsed[2];
    return { tid, datetime };
  }

  private castCell(cell: string): number | null {
    if (cell === "null") return null;
    const val = +cell;
    if (isNaN(val)) throw new Error("Cell's value is naither number nor null");
    return val;
  }

  private generateFileName(teamId: number) {
    const datetime = format(new Date(), "yyyy-MM-ddTHH:mm:ss"); // TODO: current timezone
    const filename = `report_${teamId}_${datetime}.csv`;
    return filename;
  }

  private getReportPath(filename: string) {
    return joinThrowable(this.cfg.REPORTS_PATH, filename);
  }
}
