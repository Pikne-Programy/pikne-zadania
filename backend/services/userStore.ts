// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { RoleType, UserType } from "../types/mod.ts";
import {
  IConfigService,
  IDatabaseService,
  IUserStore,
} from "../interfaces/mod.ts";
import { StoreTarget } from "./mod.ts";
import { User } from "../models/mod.ts";
import { firsthash, secondhashSync } from "../utils/mod.ts";

export class UserStore implements IUserStore {
  constructor(
    private cfg: IConfigService,
    private db: IDatabaseService,
    private target: StoreTarget,
  ) {}

  async init() {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE.",
    ) => console.warn(`WARN: ${what} is present. ${why}`);
    const root = this.get(this.cfg.hash("root"));
    const rootType: { login: string; name: string; role: "admin" } = {
      login: "root",
      name: "root",
      role: "admin",
    };
    const config = this.cfg.ROOT_CONF;
    if (!config.enable) {
      if (config.password) warn("ROOT_PASS");
      if (config.dhPassword) warn("ROOT_DHPASS");
      if (root) await this.delete(this.cfg.hash("root"));
      return;
    }
    warn("ROOT_ENABLE", "It can be a security issue.");
    if (config.dhPassword) {
      if (config.password) warn("ROOT_PASS");
      if (
        await root.exists() && await root.dhPassword.get() == config.dhPassword
      ) {
        console.log("ROOT was not changed.");
      } else {
        await this.add(
          { team: 0 },
          { dhPassword: config.dhPassword, ...rootType },
        );
        console.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!(config.password || root)) {
        throw new Error("no credentials for root");
      }
      if (config.password) {
        console.log(new Date(), "Generating root password hash...");
        const dhPassword = secondhashSync(firsthash("root", config.password));
        console.log(new Date(), "Generated!");
        console.warn(`Please unset ROOT_PASS!`);
        console.warn(`Set ROOT_DHPASS=${dhPassword} if needed.`);
        await this.add({ invitation: "" }, { dhPassword, ...rootType });
        console.warn("ROOT was registered with ROOT_PASS.");
      }
    }
  }

  get(id: string) {
    return new User(this.db, this.target!, id);
  }

  async add(
    where: { invitation: string } | { team: number },
    options:
      & {
        login: string;
        name: string;
        number?: number;
        role: RoleType;
        seed?: number;
      }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<0 | 1 | 2> {
    const team = ("team" in where)
      ? where.team
      : await this.target.ts.invitation.get(where.invitation) ?? null;
    if (team === null || !this.target.ts.get(team).exists()) {
      return 1;
    }
    const user: UserType = {
      id: this.cfg.hash(options.login),
      login: options.login,
      name: options.name,
      number: options.number,
      team,
      dhPassword: ("dhPassword" in options)
        ? options.dhPassword
        : this.cfg.hash(options.hashedPassword),
      role: options.role,
      tokens: [],
      seed: options.seed,
      exercises: {},
    };
    if (options.role === "admin") {
      await this.db.users!.updateOne({ id: user.id }, user, { upsert: true });
    } else {
      if (await this.get(user.id).exists()) return 2; // user must not exist
      const team = this.target.ts.get(user.team);
      if (!await team.exists()) return 1; // team must exist
      await this.db.users!.insertOne(user);
      await team.members.add(user.id);
    }
    return 0;
  }

  async delete(id: string): Promise<void> {
    const user = this.get(id);
    if (!await user.exists()) {
      throw new Error(`User with id ${id} doesn't exists`);
    }
    await this.db.users!.deleteOne({ id: user.id });
    const team = this.target.ts.get(await user.team.get());
    if (team) team.members.remove(user.id);
  }
}
