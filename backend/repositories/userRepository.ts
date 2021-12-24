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
import { ConfigService, Logger } from "../services/mod.ts";
import { Collection } from "../deps.ts";
import { CircularDependencies } from "./mod.ts";
import { User } from "../models/mod.ts"; // TODO: get rid off

type AddOptions = {
  login: string;
  name: string;
  number?: number;
  role?: RoleType;
  seed?: number;
} & ({ hashedPassword: string } | { dhPassword: string });

export class UserRepository {
  constructor(
    private config: ConfigService,
    private usersCollection: Collection<UserType>,
    private logger: Logger,
    private circularDependencyResolver: CircularDependencies
  ) {}

  private handle<T>(x: T | CustomDictError): T {
    if (x instanceof CustomDictError) {
      throw x;
    }

    return x;
  }

  async init() {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE."
    ) => {
      this.logger.warn(`WARN: ${what} is present. ${why}`);
    };
    const root = this.get(this.config.hash("root"));
    const rootType: { login: string; name: string; role: "admin" } = {
      login: "root",
      name: "root",
      role: "admin",
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
        this.handle(await this.delete(this.config.hash("root")));
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
        this.handle(
          await this.add(
            { teamId: 0 },
            {
              dhPassword: config.dhPassword,
              ...rootType,
            }
          )
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

        this.handle(await this.add({ teamId: 0 }, { dhPassword, ...rootType }));

        this.logger.warn("ROOT was registered with ROOT_PASS.");
      }
    }
  }

  get(id: string) {
    return new User(
      this.usersCollection,
      this.circularDependencyResolver.teamRepository,
      id
    );
  }

  async add(
    where: { invitation: string },
    options: AddOptions
  ): Promise<void | CustomDictError<
    "UserAlreadyExists" | "TeamInvitationNotFound"
  >>;
  async add(
    where: { teamId: number },
    options: AddOptions
  ): Promise<void | CustomDictError<"UserAlreadyExists" | "TeamNotFound">>;
  async add(
    where: { invitation: string } | { teamId: number },
    options: AddOptions
  ): Promise<void | CustomDictError<
    "UserAlreadyExists" | "TeamNotFound" | "TeamInvitationNotFound"
  >> {
    const teamId =
      "teamId" in where
        ? where.teamId
        : (await this.circularDependencyResolver.teamRepository.invitation.get(
            where.invitation
          )) ?? NaN;
    const team = this.circularDependencyResolver.teamRepository.get(teamId); // teamId checked below
    const isExisting = await team.exists();
    /** admin team */
    let force = false;

    if (!isExisting) {
      if (!("teamId" in where)) {
        return new CustomDictError("TeamInvitationNotFound", {});
      }
      if (where.teamId === 0) {
        force = true;
      }
      if (!force) {
        return new CustomDictError("TeamNotFound", { teamId });
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
        return new CustomDictError("UserAlreadyExists", { userId: user.id });
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
      return new CustomDictError("UserNotFound", { userId });
    }
    const team = this.circularDependencyResolver.teamRepository.get(
      await user.team.get()
    );

    if (await team.exists()) {
      await team.members.remove(user.id);
    }

    await this.usersCollection.deleteOne({ id: user.id });
  }
}
