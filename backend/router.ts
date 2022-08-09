// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router } from "./deps.ts";
import { placeholder } from "./utils/mod.ts";
import {
  AuthController,
  SessionController,
  SubjectController,
  TeamController,
  UserController,
} from "./controllers/mod.ts";

export class ApiRouterBuilder {
  readonly router: Router;

  constructor(
    private au: AuthController,
    private s: SubjectController,
    private tm: TeamController,
    private us: UserController,
    private se: SessionController,
  ) {
    this.router = new Router()
      .get("/api", placeholder(200, {}))
      .use(
        "/api",
        new Router()
          .use("/subject", this.s.router.routes())
          .use("/auth", this.au.router.routes())
          .use("/user", this.us.router.routes())
          .use("/team", this.tm.router.routes())
          .use("/session", this.se.router.routes())
          .routes(),
      );
  }
}
