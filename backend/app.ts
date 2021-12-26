// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Application } from "./deps.ts";
import { ErrorHandlerMiddleware, LoggerMiddleware } from "./middlewares/mod.ts";
import { resolveIoC } from "./core/mod.ts";

export async function createApp() {
  const app = new Application();
  const ioCContainer = await resolveIoC();

  app.addEventListener("listen", () => {
    ioCContainer.logger.log("Server started");
  });

  app.addEventListener("error", (e) => {
    ioCContainer.logger.recogniseAndTrace(e);
  });

  app
    .use(LoggerMiddleware(ioCContainer.logger))
    .use(ErrorHandlerMiddleware(ioCContainer.logger))
    .use(ioCContainer.router.routes())
    .use(ioCContainer.router.allowedMethods());

  return {
    app,
    ...ioCContainer,
  };
}
