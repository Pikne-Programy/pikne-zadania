// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Router, RouterContext } from "../deps.ts";

const entryPointController = (ctx: RouterContext): undefined => {
  ctx.response.status = 200;
  ctx.response.body = {};
  return undefined;
};

export const createApiRoutes = (routers: { router: Router }[]) =>
  new Router()
    .get("/api", entryPointController)
    .use(
      "/api",
      routers
        .reduce(
          (accRouter, { router }) => accRouter.use(router.routes()),
          new Router()
        )
        .routes()
    );
