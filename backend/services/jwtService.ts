// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { compare, create, getNumericDate, verify } from "../deps.ts";
import { CustomDictError } from "../common/mod.ts";
import { UserRepository } from "../repositories/mod.ts";
import { ConfigService, Logger } from "./mod.ts";

export class JWTService {
  constructor(
    private config: ConfigService,
    private userRepository: UserRepository,
    private logger: Logger
  ) {}

  async create(login: string, hashedPassword: string) {
    const userId = this.config.hash(login);
    const user = this.userRepository.get(userId);

    if (
      !(
        (await user.exists()) &&
        (await user.dhPassword
          .get()
          .then((password) => compare(hashedPassword, password)))
      )
    ) {
      throw new CustomDictError("UserCredentialsInvalid", { userId });
    }

    const { header, key, exp } = this.config.JWT_CONF;
    const payload = {
      id: userId,
      exp: getNumericDate(exp),
    };
    const jwt = await create(header, payload, key); // throwable

    await user.tokens.add(jwt);

    return jwt;
  }

  async resolve(jwt?: string) {
    try {
      if (jwt === undefined) {
        throw undefined; //TODO error
      }

      const { header, key } = this.config.JWT_CONF;
      const userId = await verify(jwt, key, header.alg).then(({ id }) => id); // TODO: throwable

      if (typeof userId !== "string") {
        throw undefined; //TODO error
      }

      const user = this.userRepository.get(userId);

      if (!(await user.exists()) || !(await user.tokens.exists(jwt))) {
        throw undefined; //TODO error
      }

      return userId;
    } catch (e) {
      if (e !== undefined) {
        this.logger.recogniseAndTrace(e, { customVerbosity: 2 });
      }

      throw new CustomDictError("JWTNotFound", {});
    }
  }

  revoke(userId: string, jwt: string) {
    const user = this.userRepository.get(userId);

    if (!user.tokens.exists(jwt)) {
      throw new CustomDictError("JWTNotFound", {});
    }

    return user.tokens.remove(jwt);
  }
}
