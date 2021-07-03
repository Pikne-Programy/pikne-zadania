// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router } from "./deps.ts";
import { placeholder } from "./utils/mod.ts";
import {
  AuthController,
  ExercisesController,
  TeamsController,
  UsersController,
} from "./controllers/mod.ts";

// TODO

export default class RouterBuilder {
  readonly router: Router;

  constructor(
    private auth: AuthController,
    private ex: ExercisesController,
    private tm: TeamsController,
    private us: UsersController,
  ) {
    const authReq = (b: any, n: any) => this.auth.authorize(true)(b, n);
    const authNotReq = (b: any, n: any) => this.auth.authorize(false)(b, n);
    const seed = (b: any, n: any) => this.ex.seed(b, n);

    const b = <T, U, P>(f: (a: T, b: P) => U) => ((a: T, b: P) => f(a, b));
    this.router = new Router()
      .get("/api", placeholder(200, {}))
      .get("/img/:subject/:file", (b: any) => this.ex.getStaticContent(b))
      .use(
        "/api",
        new Router().use(
          "/exercise",
          new Router()
            .get("/list", authNotReq, (b: any) => this.ex.list(b))
            //.post("/get", authNotReq, (b: any) => this.ex.get(b))
            //.post("/update", authReq, (b: any) => this.ex.update(b))
            .post("/check", authNotReq, seed, (b: any) => this.ex.check(b))
            .post("/render", authNotReq, seed, (b: any) => this.ex.render(b))
            //.post("/preview", authNotReq, (b: any) => this.ex.preview(b))
            .routes(),
        ).use(
          "/auth",
          new Router()
            .post("/register", (b: any) => this.auth.register(b))
            .post("/login", (b: any) => this.auth.login(b))
            .post("/logout", authReq, (b: any) => this.auth.logout(b))
            .routes(),
        ).use(
          "/user",
          new Router()
            .get("/current", authReq, (b: any) => this.us.current(b))
            .post("/delete", authReq, (b: any) => this.us.deleteUser(b))
            .post("/update", authReq, (b: any) => this.us.updateUser(b))
            .post("/info", authReq, (b: any) => this.us.userInfo(b))
            .routes(),
        ).use(
          "/team",
          new Router()
            .post("/create", authReq, (b: any) => this.tm.add(b))
            .post("/delete", authReq, (b: any) => this.tm.delete(b))
            .post("/update", authReq, (b: any) => this.tm.update(b))
            .get("/list", authReq, (b: any) => this.tm.getAll(b))
            .post("/info", authReq, (b: any) => this.tm.get(b))
            .routes(),
        ).routes(),
      ) as any;
  }
}
