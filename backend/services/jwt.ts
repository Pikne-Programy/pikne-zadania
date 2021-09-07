// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { compare, create, getNumericDate, verify } from "../deps.ts";
import { handleThrown } from "../utils/mod.ts";
import { CustomDictError } from "../types/mod.ts";
import { IConfigService, IJWTService, IUserStore } from "../interfaces/mod.ts";

export class JWTService implements IJWTService {
  constructor(private cfg: IConfigService, private us: IUserStore) {}

  private payload(login: string) {
    return {
      id: login,
      exp: getNumericDate(this.cfg.JWT_CONF.exp),
    };
  }

  async create(login: string, hashedPassword: string) {
    const userId = this.cfg.hash(login);
    const user = this.us.get(userId);
    if (
      !await user.exists() ||
      !await compare(hashedPassword, await user.dhPassword.get())
    ) {
      return new CustomDictError("UserCredentialsInvalid", { userId });
    }
    const payload = this.payload(userId);
    const conf = this.cfg.JWT_CONF;
    const jwt = await create(conf.header, payload, conf.key); // throwable
    await user.tokens.add(jwt);
    return jwt;
  }

  async resolve(jwt?: string) {
    try {
      if (jwt === undefined) throw undefined;
      const conf = this.cfg.JWT_CONF;
      const payload = await verify(jwt, conf.key, conf.header.alg); // TODO: throwable
      const userId = payload.id;
      if (typeof userId !== "string") throw undefined;
      const user = this.us.get(userId);
      if (!await user.exists() || !await user.tokens.exists(jwt)) {
        throw undefined;
      }
      return userId;
    } catch (e) {
      if (e !== undefined && this.cfg.VERBOSITY >= 2) handleThrown(e);
    }
    return new CustomDictError("JWTNotFound", {});
  }

  async revoke(userId: string, jwt: string) {
    const user = this.us.get(userId);
    if (!user.tokens.exists(jwt)) return new CustomDictError("JWTNotFound", {});
    await user.tokens.remove(jwt);
  }
}
