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
import { CustomDictError } from "../common/mod.ts";
import { ConfigService, Logger, HashService } from "../services/mod.ts";
import { Collection } from "../deps.ts";
import { User, RoleType, UserType, Team } from "../models/mod.ts";

export class UserRepository {
  constructor(
    private config: ConfigService,
    public collection: Collection<UserType>,
    private logger: Logger,
    private hashService: HashService
  ) {}

  async init(rootTeam: Team) {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE."
    ) => this.logger.warn(`WARN: ${what} is present. ${why}`);

    const root = this.get(this.hashService.hash("root"));
    const rootType = {
      login: "root",
      name: "root",
      role: "admin" as const,
    };
    const config = this.config.ROOT_CONF;

    if (!config.enable) {
      if (config.password) {
        warn("ROOT_PASS");
      }
      if (config.dhPassword) {
        warn("ROOT_DHPASS");
      }
      if (await root.exists()) {
        await this.delete(root);
      }
      return;
    }

    warn("ROOT_ENABLE", "It can be a security issue.");

    if (config.dhPassword) {
      if (config.password) {
        warn("ROOT_PASS");
      }

      if (
        (await root.exists()) &&
        (await root.dhPassword.get()) == config.dhPassword
      ) {
        this.logger.log("ROOT was not changed.");
      } else {
        await this.add(rootTeam, {
          ...rootType,
          dhPassword: config.dhPassword,
        });

        this.logger.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!(config.password || root)) {
        throw new Error("no credentials for root");
      }

      if (config.password) {
        this.logger.log(new Date(), "Generating root password hash...");

        const dhPassword = secondhashSync(firsthash("root", config.password));

        this.logger.log(new Date(), "Generated!");

        this.logger.warn(
          `Please unset ROOT_PASS!\nSet ROOT_DHPASS=${dhPassword} if needed.`
        );

        await this.add(rootTeam, { ...rootType, dhPassword });

        this.logger.warn("ROOT was registered with ROOT_PASS.");
      }
    }
  }

  get(id: string) {
    return new User(this, id);
  }
  /**
   *
   * @param team { invitation: string } | { teamId: number }
   * @param options
   */
  async add(
    team: Team,
    options: {
      login: string;
      name: string;
      number?: number;
      role?: RoleType;
      seed?: number;
    } & ({ hashedPassword: string } | { dhPassword: string })
  ) {
    const isExisting = await team.exists();
    /** admin team */
    let force = false;

    if (!isExisting) {
      if (!("teamId" in team)) {
        throw new CustomDictError("TeamInvitationNotFound", {});
      }
      if (team.id === 0) {
        force = true;
      }
      if (!force) {
        throw new CustomDictError("TeamNotFound", { teamId: team.id });
      }
    }

    const special: Record<number, RoleType> = { 0: "admin", 1: "teacher" };
    const user: UserType = {
      id: this.hashService.hash(options.login),
      login: options.login,
      name: options.name,
      number: options.number,
      team: team.id,
      dhPassword:
        "dhPassword" in options
          ? options.dhPassword
          : await secondhash(options.hashedPassword),
      role: options.role ?? special[team.id] ?? "student",
      tokens: [],
      seed: options.seed ?? generateSeed(),
      exercises: {},
    };

    if (options.role === "admin") {
      await this.collection.updateOne({ id: user.id }, user, {
        upsert: true,
      });
    } else {
      if (await this.get(user.id).exists()) {
        throw new CustomDictError("UserAlreadyExists", { userId: user.id });
      }

      await this.collection.insertOne(user);

      if (!force) {
        await team.members.add(user.id);
      }
    }
  }

  async delete(user: User) {
    if (!(await user.exists())) {
      throw new CustomDictError("UserNotFound", { userId: user.id });
    }

    await this.collection.deleteOne({ id: user.id });
  }
}
