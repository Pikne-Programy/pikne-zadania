// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { generateSeed } from "../utils/mod.ts";
import { ConfigService, Logger, HashService } from "../services/mod.ts";
import { Collection } from "../deps.ts";
import { User } from "../models/mod.ts";
import { Repository } from "./mod.ts";

export class UserRepository extends Repository<User> {
  constructor(
    collection: Collection<User>,
    private logger: Logger,
    private hashService: HashService
  ) {
    super(User, collection);
  }

  async init(ConfigService: ConfigService) {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE."
    ) => this.logger.warn(`WARN: ${what} is present. ${why}`);

    const addRoot = async (dhPassword: string) => {
      const user = {
        id: this.hashService.hash("root"),
        login: "root",
        name: "root",
        team: 0,
        dhPassword,
        role: "admin",
        seed: generateSeed(),
        tokens: [],
        exercises: {},
      };

      await this.collection.updateOne({ id: user.id }, user, {
        upsert: true,
      });
    };

    const root = await this.get(this.hashService.hash("root"));
    const config = ConfigService.ROOT_CONF;

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
        await addRoot(config.dhPassword);

        this.logger.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!config.password && !root) {
        throw new Error("no credentials for root");
      }

      if (!config.password) {
        return;
      }

      this.logger.log(new Date(), "Generating root password hash...");

      const dhPassword = this.hashService.secondhashSync(
        this.hashService.firsthash("root", config.password)
      );

      this.logger
        .log(new Date(), "Generated!")
        .warn(
          `Please unset ROOT_PASS!\nSet ROOT_DHPASS=${dhPassword} if needed.`
        );

      await addRoot(dhPassword);

      this.logger.warn("ROOT was registered with ROOT_PASS.");
    }
  }
}
