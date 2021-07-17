// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { compare, create, getNumericDate, Payload, verify } from "../deps.ts";
import { generateSeed, handleThrown, secondhash } from "../utils/mod.ts";
import { IAuth, IConfig, IUserFactory } from "../interfaces/mod.ts";

export class Auth implements IAuth {
  constructor(
    private cfg: IConfig,
    private uf: IUserFactory,
  ) {}

  private payload(login: string) {
    const payload: Payload = {
      id: login,
      exp: getNumericDate(this.cfg.JWT_CONF.exp),
    };
    return payload;
  }

  async resolve(jwt?: string) {
    const uid = jwt ? await this.validateJWT(jwt) : null;
    return uid ? await this.uf.get(uid) : null;
  }

  private async validateJWT(jwt: string) {
    try {
      const payload: Payload = await verify(
        jwt,
        this.cfg.JWT_CONF.key,
        this.cfg.JWT_CONF.header.alg,
      );
      const uid = payload.id;
      if (typeof uid === "string") {
        const user = await this.uf.get(uid);
        if (user?.tokens.exists(jwt)) return uid;
      }
    } catch (e) {
      handleThrown(e);
    }
    return null;
  }

  async login(login: string, hashedPassword: string) {
    const uid = this.cfg.hash(login);
    const user = await this.uf.get(uid);
    if (!user) return null;
    if (!await compare(hashedPassword, user.dhpassword)) return null;
    const jwt = await create(
      this.cfg.JWT_CONF.header,
      this.payload(uid),
      this.cfg.JWT_CONF.key,
    ); // throwable
    await user.tokens.add(jwt);
    return jwt;
  }

  async logout(login: string, jwt: string) {
    const user = await this.uf.get(login);
    return user?.tokens.remove(jwt) ?? false;
  }

  async register(options: {
    login: string;
    name: string;
    hashedPassword: string;
    number: number;
    invitation: string;
  }) {
    const {
      login,
      name,
      hashedPassword,
      number,
      invitation,
    } = options;
    const team = this.uf.invitations[invitation];
    if (!team) return 1;
    const user = {
      email: login,
      name: name,
      dhpassword: await secondhash(hashedPassword),
      team,
      tokens: [],
      seed: generateSeed(),
      role: team > 1
        ? { name: "student" as const, number: number, exercises: {} }
        : { name: "teacher" as const },
    };
    return (await this.uf.add(user)) ? 0 : 2;
  }
}
