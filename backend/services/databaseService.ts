// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { MongoClient, Database } from "../deps.ts";
import { delay } from "../utils/mod.ts";
import { ConfigService } from "../services/mod.ts";

export class DatabaseService {
  private client?: MongoClient;
  /**
   * ! call connect first
   */
  #db!: Database;

  constructor(private config: ConfigService) {}

  async connect(): Promise<this> {
    this.client = new MongoClient();
    //FIXME does not connect do this?
    await delay(this.config.MONGO_CONF.time); // wait for database
    await this.client.connect(this.config.MONGO_CONF.url); // throwable
    this.#db = this.client.database(this.config.MONGO_CONF.db);

    if (this.config.FRESH) {
      await this.drop();
    }

    return this;
  }

  getCollection<T>(name: string) {
    return this.#db.collection<T>(name);
  }

  close(): this {
    this.client?.close();
    return this;
  }

  async drop() {
    const filterUseless = (e: unknown) =>
      !(e instanceof Error) || !/"NamespaceNotFound"/.test(e.message);

    const filterResolved = (
      result: PromiseSettledResult<unknown>
    ): result is PromiseRejectedResult => result.status === "rejected";

    const collections = await this.#db.listCollectionNames({});

    const drops = collections.map((collection) =>
      this.#db!.collection(collection).drop()
    );

    const results = await Promise.allSettled(drops);

    return results
      .filter(filterResolved)
      .map(({ reason }) => reason)
      .filter(filterUseless)
      .forEach((error) => {
        throw error;
      });
  }
}
