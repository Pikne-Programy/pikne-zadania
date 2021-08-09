// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import {
  AuthController,
  ExerciseController,
  SubjectController,
  SubjectExerciseController,
  TeamController,
  UserController,
} from "./controllers/mod.ts";
import { placeholder, Router } from "./utils/mod.ts";

export default class RouterBuilder {
  readonly router: Router;

  constructor(
    private au: AuthController,
    private s: SubjectController,
    private se: SubjectExerciseController,
    private ex: ExerciseController,
    private tm: TeamController,
    private us: UserController,
  ) {
    this.router = new Router()
      .get("/api", placeholder(200, {}))
      .get("/img/:subject/:file", this.ex.static)
      .use(
        "/api",
        new Router().use(
          "/exercise",
          new Router()
            .get("/list", this.ex.list)
            .post("/check", this.ex.check)
            .post("/render", this.ex.render)
            .routes(),
        ).use(
          "/subject",
          new Router()
            .get("/list", this.s.list)
            .post("/create", this.s.create)
            .post("/info", this.s.info)
            .post("/permit", this.s.permit)
            .use(
              "/exercise",
              new Router()
                .post("/get", this.se.get)
                .post("/add", this.se.add)
                .post("/update", this.se.update)
                .post("/preview", this.se.preview)
                .routes(),
            )
            .routes(),
        ).use(
          "/auth",
          new Router()
            .post("/register", this.au.register)
            .post("/login", this.au.login)
            .post("/logout", this.au.logout)
            .routes(),
        ).use(
          "/user",
          new Router()
            .get("/current", this.us.current)
            .post("/delete", this.us.delete)
            .post("/update", this.us.update)
            .post("/info", this.us.info)
            .routes(),
        ).use(
          "/team",
          new Router()
            .post("/create", this.tm.create)
            .post("/delete", this.tm.delete)
            .post("/update", this.tm.update)
            .get("/list", this.tm.list)
            .post("/info", this.tm.info)
            .routes(),
        ).routes(),
      );
  }
}
