// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors } from "../deps.ts";
import { validateJWT } from "../controllers/auth.ts";
import { RouterContext, User } from "../utils/mod.ts";

function authorize(required: boolean) {
  return async (ctx: RouterContext, next: () => Promise<void>) => {
    const jwt = ctx.cookies.get("jwt");
    const uid = jwt ? await validateJWT(jwt) : null;
    ctx.state.user = uid ? await User.get(uid) : null;
    if (ctx.state.user == null) ctx.cookies.delete("jwt");
    if (required && !ctx.state.user) throw new httpErrors["Forbidden"]();
    await next();
  };
}

export const authReq = authorize(true);
export const authNotReq = authorize(false);
