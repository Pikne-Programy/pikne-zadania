// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Application } from "./deps.ts";
import { ErrorHandlerMiddleware } from "./middlewares/mod.ts";
import { resolveIoC } from "./core/mod.ts";

export async function createApp() {
  const app = new Application();
  const IoCContainer = await resolveIoC();

  app.addEventListener("listen", () => {
    IoCContainer.logger.log("Server started");
  });

  app.addEventListener("error", (e) => {
    IoCContainer.logger.recogniseAndTrace(e);
  });

  app
    .use(ErrorHandlerMiddleware(IoCContainer.logger))
    .use(IoCContainer.router.routes())
    .use(IoCContainer.router.allowedMethods());

  return {
    app,
    ...IoCContainer,
  };
}
