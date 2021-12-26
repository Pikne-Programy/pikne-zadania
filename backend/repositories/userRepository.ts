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
import { ConfigService, Logger } from "../services/mod.ts";
import { Collection } from "../deps.ts";
import { TeamRepository } from "./mod.ts";
import { User, RoleType, UserType } from "../models/mod.ts"; // TODO: get rid off

export class UserRepository {
  constructor(
    private config: ConfigService,
    private usersCollection: Collection<UserType>,
    private logger: Logger,
    private teamRepository: TeamRepository
  ) {}

  async init() {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE."
    ) => {
      this.logger.warn(`WARN: ${what} is present. ${why}`);
    };
    const root = this.get(this.config.hash("root"));
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
        await this.delete(this.config.hash("root"));
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
        await this.add(
          { teamId: 0 },
          {
            dhPassword: config.dhPassword,
            ...rootType,
          }
        );

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

        await this.add({ teamId: 0 }, { dhPassword, ...rootType });

        this.logger.warn("ROOT was registered with ROOT_PASS.");
      }
    }
  }

  get(id: string) {
    return new User(this.usersCollection, this.teamRepository, id);
  }

  async add(
    where: { invitation: string } | { teamId: number },
    options: {
      login: string;
      name: string;
      number?: number;
      role?: RoleType;
      seed?: number;
    } & ({ hashedPassword: string } | { dhPassword: string })
  ) {
    const teamId =
      "teamId" in where
        ? where.teamId
        : (await this.teamRepository.invitation.get(where.invitation)) ?? NaN;
    const team = this.teamRepository.get(teamId); // teamId checked below
    const isExisting = await team.exists();
    /** admin team */
    let force = false;

    if (!isExisting) {
      if (!("teamId" in where)) {
        throw new CustomDictError("TeamInvitationNotFound", {});
      }
      if (where.teamId === 0) {
        force = true;
      }
      if (!force) {
        throw new CustomDictError("TeamNotFound", { teamId });
      }
    }

    const special: { [key: number]: RoleType } = { 0: "admin", 1: "teacher" };
    const user: UserType = {
      id: this.config.hash(options.login),
      login: options.login,
      name: options.name,
      number: options.number,
      team: teamId,
      dhPassword:
        "dhPassword" in options
          ? options.dhPassword
          : await secondhash(options.hashedPassword),
      role: options.role ?? special[teamId] ?? "student",
      tokens: [],
      seed: options.seed ?? generateSeed(),
      exercises: {},
    };

    if (options.role === "admin") {
      await this.usersCollection.updateOne({ id: user.id }, user, {
        upsert: true,
      });
    } else {
      if (await this.get(user.id).exists()) {
        throw new CustomDictError("UserAlreadyExists", { userId: user.id });
      }

      await this.usersCollection.insertOne(user);

      if (!force) {
        await team.members.add(user.id);
      }
    }
  }

  async delete(userId: string) {
    const user = this.get(userId);
    if (!(await user.exists())) {
      throw new CustomDictError("UserNotFound", { userId });
    }
    const team = this.teamRepository.get(await user.team.get());

    if (await team.exists()) {
      await team.members.remove(user.id);
    }

    await this.usersCollection.deleteOne({ id: user.id });
  }
}
