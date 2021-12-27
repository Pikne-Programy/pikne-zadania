// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { userSchema } from "../schemas/mod.ts";
import { User } from "../models/mod.ts";
import { TeamRepository, UserRepository } from "../repositories/mod.ts";
import { IAuthorizer, controller } from "../core/mod.ts";

export function UserController(
  authorize: IAuthorizer,
  userRepository: UserRepository,
  teamRepository: TeamRepository
) {
  async function isAssigneeOf(assignee: User, who?: User) {
    // * assuming `assignee` exists
    if (assignee.role === "admin") {
      return true;
    }
    if (!who) {
      return false;
    }
    const team = await teamRepository.get(who.team);

    return team && assignee.id === team.assignee;
  }

  const info = controller({
    schema: {
      body: {
        userId: userSchema.idOptional, //FIXME why it is even optional?
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      const user = await authorize(ctx);
      const { userId = user.id } = body;

      const who = await userRepository.get(userId);

      if (
        userId === user.id || // themself or
        (await isAssigneeOf(user, who)) // member of their team // TODO: change when dealing with groups (but to what?)
      ) {
        throw new httpErrors["Forbidden"]();
      }

      if (!who) {
        throw new httpErrors["NotFound"]();
      }

      ctx.response.body = {
        name: who.name,
        teamId: who.team,
        number: who.number ?? null,
      };
    },
  });

  const update = controller({
    schema: {
      body: {
        userId: userSchema.id,
        number: userSchema.numberOptional,
        name: userSchema.nameOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { userId, number, name } }) => {
      const user = await authorize(ctx); //! A
      const who = await userRepository.get(userId);

      // member of not their team // TODO: change when dealing with groups (but to what? maybe add two Ps?)
      if (!(await isAssigneeOf(user, who))) {
        throw new httpErrors["Forbidden"]();
      }

      if (!who) {
        throw new httpErrors["NotFound"]();
      }

      if (number !== null) {
        await userRepository.setKey(
          who,
          "number",
          isNaN(number) ? undefined : number
        );
      }

      if (name !== null) {
        await userRepository.setKey(who, "name", name);
      }
    },
  });

  const remove = controller({
    schema: {
      body: {
        userId: userSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { userId } }) => {
      const user = await authorize(ctx);
      const who = await userRepository.get(userId);

      if (!(await isAssigneeOf(user, who))) {
        // TODO: change when dealing with groups (but to what? maybe add two Ps?)
        throw new httpErrors["Forbidden"]();
      }
      if (!who) {
        throw new httpErrors["NotFound"]();
      }

      await userRepository.delete(who);

      const team = await teamRepository.get(user.team);

      if (team) {
        await teamRepository.membersFor(team).remove(user.id);
      }
    },
  });

  return new Router({
    prefix: "/user",
  })
    .post("/info", info)
    .post("/update", update)
    .post("/delete", remove);
}
