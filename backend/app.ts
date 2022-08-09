// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Application, Context, HttpError } from "./deps.ts";
import { handleThrown } from "./utils/mod.ts";
import { IConfigService } from "./interfaces/mod.ts";
import {
  ConfigService,
  Database,
  ExerciseService,
  ExerciseStore,
  JWTService,
  ReportsService,
  StoreTarget,
  SubjectStore,
  TeamStore,
  UserStore,
} from "./services/mod.ts";
import {
  AuthController,
  SessionController,
  SubjectController,
  TeamController,
  UserController,
} from "./controllers/mod.ts";
import { ApiRouterBuilder } from "./router.ts";

export async function constructApp(cfg: IConfigService = new ConfigService()) {
  const app = new Application();

  if (cfg.VERBOSITY >= 3) {
    app.addEventListener("listen", () => console.log("Server started"));
  }
  if (cfg.VERBOSITY >= 1) {
    app.addEventListener("error", handleThrown);
  }

  function die(ctx: Context, status = 500, message = "") {
    ctx.response.status = status;
    ctx.response.body = { status, message };
  }

  app.use(async (ctx: Context, next: () => unknown) => {
    try {
      await next();
    } catch (e) {
      if (e instanceof HttpError) die(ctx, e.status, e.message);
      else {
        die(ctx, 500, e instanceof Error ? e.message : "");
        if (cfg.VERBOSITY >= 1) handleThrown(e);
      }
    } finally {
      if (cfg.VERBOSITY >= 3) {
        console.log(
          ctx.request.method,
          ctx.request.url.pathname,
          ctx.response.status,
        );
      }
    }
  });

  const db = new Database(cfg);
  await db.connect();
  const target = new StoreTarget(cfg, db, TeamStore, UserStore);
  await target.us.init();
  await target.ts.init();
  const es = new ExerciseStore(cfg);
  const ss = new SubjectStore(db, es);
  await ss.init();
  const ex = new ExerciseService(es);
  const jwt = new JWTService(cfg, target.us);
  const rep = new ReportsService(cfg, target.us, target.ts);
  const ac = new AuthController(cfg, target.us, jwt);
  const sc = new SubjectController(cfg, jwt, target.us, target.ts, ss, es, ex);
  const tc = new TeamController(jwt, target.us, target.ts);
  const uc = new UserController(jwt, target.us, target.ts);
  const sec = new SessionController(
    cfg,
    jwt,
    target.us,
    target.ts,
    es,
    ex,
    ss,
    rep,
  );

  const rb = new ApiRouterBuilder(ac, sc, tc, uc, sec);

  const router = rb.router;
  app.use(router.routes());
  app.use(router.allowedMethods());

  return {
    app,
    dropExercises: () => es.drop(),
    dropDb: () => db.drop(),
    closeDb: () => db.close(),
    cfg,
  };
}
