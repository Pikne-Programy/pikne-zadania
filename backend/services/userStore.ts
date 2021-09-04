// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  firsthash,
  generateSeed,
  secondhash,
  secondhashSync,
} from "../utils/mod.ts";
import { CustomDictError, RoleType, UserType } from "../types/mod.ts";
import {
  IConfigService,
  IDatabaseService,
  IUserStore,
} from "../interfaces/mod.ts";
import { StoreTarget } from "./mod.ts";
import { User } from "../models/mod.ts"; // TODO: get rid off

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
    ) => {
      if (this.cfg.VERBOSITY >= 2) {
        console.warn(`WARN: ${what} is present. ${why}`);
      }
    };
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
        if (this.cfg.VERBOSITY >= 3) {
          console.log("ROOT was not changed.");
        }
      } else {
        await this.add(
          { teamId: 0 },
          { dhPassword: config.dhPassword, ...rootType },
        );
        if (this.cfg.VERBOSITY >= 2) {
          console.warn("ROOT was registered with ROOT_DHPASS.");
        }
      }
    } else {
      if (!(config.password || root)) {
        throw new Error("no credentials for root");
      }
      if (config.password) {
        if (this.cfg.VERBOSITY >= 3) {
          console.log(new Date(), "Generating root password hash...");
        }
        const dhPassword = secondhashSync(firsthash("root", config.password));
        if (this.cfg.VERBOSITY >= 3) {
          console.log(new Date(), "Generated!");
        }
        if (this.cfg.VERBOSITY >= 2) {
          console.warn(
            `Please unset ROOT_PASS!\nSet ROOT_DHPASS=${dhPassword} if needed.`,
          );
        }
        await this.add({ invitation: "" }, { dhPassword, ...rootType });
        if (this.cfg.VERBOSITY >= 2) {
          console.warn("ROOT was registered with ROOT_PASS.");
        }
      }
    }
  }

  get(id: string) {
    return new User(this.db, this.target!, id);
  }

  async add(
    where: { invitation: string },
    options: {
      login: string;
      name: string;
      number?: number;
      role?: RoleType;
      seed?: number;
    } & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<
    void | CustomDictError<"UserAlreadyExists" | "TeamInvitationNotFound">
  >;
  async add(
    where: { teamId: number },
    options:
      & {
        login: string;
        name: string;
        number?: number;
        role?: RoleType;
        seed?: number;
      }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<
    | void
    | CustomDictError<"UserAlreadyExists" | "TeamNotFound">
  >;
  async add(
    where: { invitation: string } | { teamId: number },
    options:
      & {
        login: string;
        name: string;
        number?: number;
        role?: RoleType;
        seed?: number;
      }
      & ({ hashedPassword: string } | { dhPassword: string }),
  ): Promise<
    | void
    | CustomDictError<
      "UserAlreadyExists" | "TeamNotFound" | "TeamInvitationNotFound"
    >
  > {
    const teamId = ("teamId" in where)
      ? where.teamId
      : await this.target.ts.invitation.get(where.invitation) ?? NaN;
    const team = this.target.ts.get(teamId); // teamId checked below
    const exists = await team.exists();
    /** admin team */ let force = false;
    if (!exists) {
      if ("teamId" in where) {
        if (where.teamId === 0) force = true;
        if (!force) return new CustomDictError("TeamNotFound", { teamId });
      } else return new CustomDictError("TeamInvitationNotFound", {});
    }
    const special: { [key: number]: RoleType } = { 0: "admin", 1: "teacher" };
    const user: UserType = {
      id: this.cfg.hash(options.login),
      login: options.login,
      name: options.name,
      number: options.number,
      team: teamId,
      dhPassword: ("dhPassword" in options)
        ? options.dhPassword
        : await secondhash(options.hashedPassword),
      role: options.role ?? special[teamId] ?? "student",
      tokens: [],
      seed: options.seed ?? generateSeed(),
      exercises: {},
    };
    if (options.role === "admin") {
      await this.db.users!.updateOne({ id: user.id }, user, { upsert: true });
    } else {
      if (await this.get(user.id).exists()) {
        return new CustomDictError("UserAlreadyExists", { userId: user.id });
      }
      await this.db.users!.insertOne(user);
      if (!force) await team.members.add(user.id);
    }
  }

  async delete(userId: string) {
    const user = this.get(userId);
    if (!await user.exists()) {
      return new CustomDictError("UserNotFound", { userId });
    }
    await this.db.users!.deleteOne({ id: user.id });
    const team = this.target.ts.get(await user.team.get());
    if (await team.exists()) await team.members.remove(user.id);
  }
}
