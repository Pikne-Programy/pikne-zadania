// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { placeholder, Router } from "./utils/mod.ts";
import {
  AuthController,
  ExercisesController,
  TeamsController,
  UsersController,
} from "./controllers/mod.ts";

export default class RouterBuilder {
  readonly router: Router;

  constructor(
    private auth: AuthController,
    private ex: ExercisesController,
    private tm: TeamsController,
    private us: UsersController,
  ) {
    const authReq = this.auth.authReq;
    const authNotReq = this.auth.authNotReq;
    const seed = this.ex.seed;

    this.router = new Router()
      .get("/api", placeholder(200, {}))
      .get("/img/:subject/:file", this.ex.getStaticContent)
      .use(
        "/api",
        new Router().use(
          "/exercise",
          new Router()
            .get("/list", authNotReq, this.ex.list)
            //.post("/get", authNotReq, this.ex.get)
            //.post("/update", authReq, this.ex.update)
            .post("/check", authNotReq, seed, this.ex.check)
            .post("/render", authNotReq, seed, this.ex.render)
            //.post("/preview", authNotReq, this.ex.preview)
            .routes(),
        ).use(
          "/auth",
          new Router()
            .post("/register", this.auth.register)
            .post("/login", this.auth.login)
            .post("/logout", authReq, this.auth.logout)
            .routes(),
        ).use(
          "/user",
          new Router()
            .get("/current", authReq, this.us.current)
            .post("/delete", authReq, this.us.deleteUser)
            .post("/update", authReq, this.us.updateUser)
            .post("/info", authReq, this.us.userInfo)
            .routes(),
        ).use(
          "/team",
          new Router()
            .post("/create", authReq, this.tm.add)
            .post("/delete", authReq, this.tm.delete)
            .post("/update", authReq, this.tm.update)
            .get("/list", authReq, this.tm.getAll)
            .post("/info", authReq, this.tm.get)
            .routes(),
        ).routes(),
      );
  }
}
