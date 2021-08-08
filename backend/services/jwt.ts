// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { compare, create, getNumericDate, verify } from "../deps.ts";
import { IConfigService, IJWTService, IUserStore } from "../interfaces/mod.ts";
import { handleThrown } from "../utils/utils.ts";

export class JWTService implements IJWTService {
  constructor(private cfg: IConfigService, private us: IUserStore) {}

  private payload(login: string) {
    return {
      id: login,
      exp: getNumericDate(this.cfg.JWT_CONF.exp),
    };
  }

  async create(login: string, hashedPassword: string) {
    const uid = this.cfg.hash(login);
    const user = this.us.get(uid);
    if (!await user.exists()) return null;
    const dhPassword = await user.dhPassword.get();
    if (!await compare(hashedPassword, dhPassword)) return null;
    const payload = this.payload(login);
    const conf = this.cfg.JWT_CONF;
    const jwt = await create(conf.header, payload, conf.key); // throwable
    await user.tokens.add(jwt);
    return jwt;
  }

  async resolve(jwt?: string) {
    if (jwt === undefined) return null;
    try {
      const conf = this.cfg.JWT_CONF;
      const payload = await verify(jwt, conf.key, conf.header.alg);
      const uid = payload.id;
      if (typeof uid !== "string") return null;
      const user = this.us.get(uid);
      if (!user.exists() || !user.tokens.exists(jwt)) return null;
      return user;
    } catch (e) {
      handleThrown(e);
    }
    return null;
  }

  async revoke(login: string, jwt: string) {
    const user = this.us.get(login);
    if (!user.tokens.exists(jwt)) throw new Error("jwt didn't exist");
    await user.tokens.remove(jwt);
  }
}
