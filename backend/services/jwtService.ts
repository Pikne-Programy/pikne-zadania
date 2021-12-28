// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { compare, create, getNumericDate, verify } from "../deps.ts";
import { CustomDictError } from "../common/mod.ts";
import { UserRepository } from "../repositories/mod.ts";
import { ConfigService, Logger, HashService } from "./mod.ts";
import { User } from "../models/mod.ts";

export class JWTService {
  constructor(
    private config: ConfigService,
    private userRepository: UserRepository,
    private logger: Logger,
    private hashService: HashService
  ) {}

  async create(login: string, hashedPassword: string) {
    const userId = this.hashService.hash(login);
    const user = await this.userRepository.getOrFail(userId);

    if (!compare(hashedPassword, user.dhPassword)) {
      throw new CustomDictError("UserCredentialsInvalid", { userId });
    }

    const { header, key, exp } = this.config.JWT_CONF;
    const payload = {
      id: userId,
      exp: getNumericDate(exp),
    };

    const jwt = await create(header, payload, key); // throwable

    await this.userRepository.arrayPush(user, "tokens", jwt);

    return jwt;
  }

  async resolve(jwt?: string) {
    if (!jwt) {
      throw new CustomDictError("JWTNotPresented", {
        description: "Missing authorization token",
      });
    }

    try {
      const { header, key } = this.config.JWT_CONF;
      const userId = await verify(jwt, key, header.alg).then(({ id }) => id); // TODO: throwable

      if (typeof userId !== "string") {
        throw undefined; //TODO error
      }

      const user = await this.userRepository.getOrFail(userId);

      if (!user.tokens.includes(jwt)) {
        throw undefined; //TODO error
      }

      return user;
    } catch (e) {
      if (e !== undefined) {
        this.logger.recogniseAndTrace(e, { customVerbosity: 2 });
      }

      throw new CustomDictError("JWTNotFound", {});
    }
  }

  async revoke(user: User, jwt: string) {
    if (!user.tokens.includes(jwt)) {
      throw new CustomDictError("JWTNotFound", {});
    }

    await this.userRepository.arrayPull(user, "tokens", jwt);
  }
}
