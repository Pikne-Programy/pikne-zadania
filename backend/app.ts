// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Application } from "./deps.ts";
import { ErrorHandlerMiddleware } from "./middlewares/mod.ts";
import { resolveDI } from "./core/mod.ts";

export async function createApp() {
  const app = new Application();
  const DIContainer = await resolveDI();

  app.addEventListener("listen", () => {
    DIContainer.logger.log("Server started");
  });

  app.addEventListener("error", (e) => {
    DIContainer.logger.recogniseAndTrace(e);
  });

  app
    .use(ErrorHandlerMiddleware(DIContainer.logger))
    .use(DIContainer.router.routes())
    .use(DIContainer.router.allowedMethods());

  return {
    app,
    ...DIContainer,
  };
}
