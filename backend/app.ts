// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Application, chalk } from "./deps.ts";
import { DatabaseDriver } from "./drivers/mod.ts";
import { createApiRoutes } from "./core/mod.ts";
import { ErrorHandlerMiddleware, LoggerMiddleware } from "./middlewares/mod.ts";
import { Logger } from "./services/mod.ts";
import { Authorizer } from "./controllers/mod.ts";
import { module } from "./module.ts";

export async function createApp() {
  const app = new Application();
  const ioCContainer = await module().resolve();

  const logger = ioCContainer["global"].resolveOrFail(Logger);
  const controllersRef = ioCContainer["controllers"];
  const db = ioCContainer["drivers"].resolveOrFail(DatabaseDriver);

  const router = createApiRoutes(
    controllersRef
      .listAvailable()
      .map((controller) => controllersRef.resolveOrFail(controller))
      .filter(
        <T>(c: T): c is Exclude<T, Authorizer> => !(c instanceof Authorizer),
      ),
  );

  app.addEventListener("listen", () => {
    logger.log(chalk.green("Server started"));
  });

  app.addEventListener("error", (e) => {
    logger.recogniseAndTrace(e);
  });

  app
    .use(LoggerMiddleware(logger))
    .use(ErrorHandlerMiddleware(logger))
    .use(router.routes())
    .use(router.allowedMethods());

  return {
    app,
    logger,
    closeDb: () => db.close(),
  };
}
