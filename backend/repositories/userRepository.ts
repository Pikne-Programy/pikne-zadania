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
import { User, RoleType, Team } from "../models/mod.ts";

export class UserRepository {
  constructor(
    private config: ConfigService,
    public collection: Collection<User>,
    private logger: Logger,
    private hashService: HashService
  ) {}

  tokensFor(user: User) {
    return {
      add: async (value: string) => {
        await this.collection.updateOne(
          { id: user.id },
          { $addToSet: { tokens: value } }
        );
      },
      exists: async (value: string) => {
        const tokens = await user.tokens;
        return tokens.includes(value);
      },
      remove: async (value: string) => {
        await this.collection.updateOne(
          { id: user.id },
          {
            $pull: { tokens: value },
          }
        );
      },
    };
  }

  exercisesFor(user: User) {
    const ex = {
      add: async (id: string, value: number) => {
        if ((await user.exercises[id]) !== undefined) {
          throw new Error(`Exercise with id ${id} already exists`);
        }
        await this.collection.updateOne(
          { id: user.id },
          { $set: { [`exercises.${id}`]: value } }
        );
      },
      set: async (id: string, value: number) => {
        await this.collection.updateOne(
          { id: user.id },
          {
            $set: { [`exercises.${id}`]: value },
          }
        );
      },
      update: async (id: string, value: number) => {
        const oldValue = user.exercises[id];
        if (oldValue === undefined) {
          await ex.add(id, value);
        } else if (oldValue < value) {
          await this.collection.updateOne(
            { id: user.id },
            {
              $set: { [`exercises.${id}`]: value },
            }
          );
        }
      },
      remove: async (id: string) => {
        await this.collection.updateOne(
          { id: user.id },
          { $unset: { [`exercises.${id}`]: "" } }
        );
      },
    };
    return ex;
  }
  async setKey<T extends keyof User>(user: User, key: T, value: User[T]) {
    const { matchedCount } = await this.collection.updateOne(
      { id: user.id },
      value === undefined
        ? {
            $unset: { [key]: "" },
          }
        : {
            $set: { [key]: value },
          }
    );

    if (!matchedCount) {
      throw new Error(`user with id: "${user.id}" does not exists`);
    }
  }
  async init(rootTeam: Team) {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE."
    ) => this.logger.warn(`WARN: ${what} is present. ${why}`);

    const root = await this.get(this.hashService.hash("root"));
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
      if (root) {
        await this.delete(root);
      }
      return;
    }

    warn("ROOT_ENABLE", "It can be a security issue.");

    if (config.dhPassword) {
      if (config.password) {
        warn("ROOT_PASS");
      }

      if (root?.dhPassword == config.dhPassword) {
        this.logger.log("ROOT was not changed.");
      } else {
        await this.add(rootTeam, {
          ...rootType,
          dhPassword: config.dhPassword,
        });

        this.logger.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!config.password && !root) {
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

  async get(id: string) {
    const user = await this.collection.findOne({ id });
    return user ? new User(user) : user;
  }

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
    const special: Record<number, RoleType> = { 0: "admin", 1: "teacher" };
    const user = new User({
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
      seed: options.seed ?? generateSeed(),
      tokens: [],
      exercises: {},
    });

    if (options.role === "admin") {
      await this.collection.updateOne({ id: user.id }, user, {
        upsert: true,
      });
    } else {
      if (await this.get(user.id)) {
        throw new CustomDictError("UserAlreadyExists", { userId: user.id });
      }

      await this.collection.insertOne(user);
    }

    return user;
  }

  async delete(user: User) {
    const deletedCount = await this.collection.deleteOne({ id: user.id });
    if (!deletedCount) {
      throw new CustomDictError("UserNotFound", { userId: user.id });
    }
  }
}
