// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router } from "./deps.ts";
import { seed } from "./middleware/seed.ts";
import { authNotReq, authReq } from "./middleware/auth.ts";
import { Auth, Exercises, Teams, Users } from "./controllers/mod.ts";
import { placeholder } from "./utils/mod.ts";

const router = new Router();
router
  .get("/api", placeholder(200, {}))
  .get("/img/:subject/:file", Exercises.getStaticContent)
  .use(
    "/api",
    new Router().use(
      "/exercise",
      new Router()
        .get("/list", authNotReq, Exercises.list)
        .post("/get", authNotReq, Exercises.get)
        .post("/update", authReq, Exercises.update)
        .post("/check", authNotReq, seed, Exercises.check)
        .post("/render", authNotReq, seed, Exercises.renderExercise)
        .post("/preview", authNotReq, Exercises.preview)
        .routes(),
    ).use(
      "/auth",
      new Router()
        .post("/register", Auth.register)
        .post("/login", Auth.login)
        .post("/logout", authReq, Auth.logout)
        .routes(),
    ).use(
      "/user",
      new Router()
        .get("/current", authReq, Users.current)
        .post("/delete", authReq, Users.deleteUser)
        .post("/update", authReq, Users.updateUser)
        .post("/info", authReq, Users.userInfo)
        .routes(),
    ).use(
      "/team",
      new Router()
        .post("/create", authReq, Teams.addTeam)
        .post("/delete", authReq, Teams.deleteTeam)
        .post("/update", authReq, Teams.updateTeam)
        .get("/list", authReq, Teams.getAllTeams)
        .post("/info", authReq, Teams.getTeam)
        .routes(),
    ).routes(),
  );

export default router;
