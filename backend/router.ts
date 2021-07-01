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
  .get("/api/exercise/list", authNotReq, Exercises.list)
  .post("/api/exercise/get", authNotReq, Exercises.get)
  .post("/api/exercise/update", authReq, Exercises.update)
  .post("/api/exercise/check", authNotReq, seed, Exercises.check)
  .post("/api/exercise/render", authNotReq, seed, Exercises.renderExercise)
  .post("/api/exercise/preview", authNotReq, Exercises.preview)
  .get("/img/:subject/:file", Exercises.getStaticContent)
  .post("/api/auth/register", Auth.register)
  .post("/api/auth/login", Auth.login)
  .post("/api/auth/logout", authReq, Auth.logout)
  .get("/api/user/current", authReq, Users.current)
  .post("/api/user/delete", authReq, Users.deleteUser)
  .post("/api/user/update", authReq, Users.updateUser)
  .post("/api/user/info", authReq, Users.userInfo)
  .post("/api/team/create", authReq, Teams.addTeam)
  .post("/api/team/delete", authReq, Teams.deleteTeam)
  .post("/api/team/update", authReq, Teams.updateTeam)
  .get("/api/team/list", authReq, Teams.getAllTeams)
  .post("/api/team/info", authReq, Teams.getTeam);

export default router;
