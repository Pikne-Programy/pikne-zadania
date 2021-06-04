// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { db, lock } from "./mod.ts";
import { GlobalType } from "../../types/mod.ts";

export abstract class Global {
  static defaultGlobal = { lastTid: 1 };

  @lock()
  static async create(_lock?: symbol): Promise<void> {
    await db.global.insertOne(Global.defaultGlobal);
  }
  @lock()
  static async get(lock?: symbol): Promise<GlobalType> {
    const global = await db.global.findOne({});
    if (!global) Global.create(lock);
    return global ?? Global.defaultGlobal;
  }
  @lock()
  static async nextTid(lock?: symbol): Promise<number> {
    const global = await Global.get(lock);
    if (!global) throw new Error("no global collection");
    await db.global.updateOne({}, { $inc: { lastTid: 1 } });
    return global.lastTid + 1;
  }
}
