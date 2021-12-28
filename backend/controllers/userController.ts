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
  //FIXME lol second version of this
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

      const who = await userRepository.getOrFail(userId);

      if (
        userId === user.id || // themself or
        (await isAssigneeOf(user, who)) // member of their team // TODO: change when dealing with groups (but to what?)
      ) {
        throw new httpErrors["Forbidden"]();
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
      const user = await authorize(ctx);
      const who = await userRepository.getOrFail(userId);

      // member of not their team // TODO: change when dealing with groups (but to what? maybe add two Ps?)
      if (!(await isAssigneeOf(user, who))) {
        throw new httpErrors["Forbidden"]();
      }

      const isNumber = number !== null;
      const query = {
        $set: Object.assign(
          {},
          isNumber && { number },
          name !== null && { name }
        ),
        $unset: Object.assign({}, !isNumber && { number }),
      };

      const { matchedCount } = await userRepository.collection.updateOne(
        {
          id: userId,
        },
        query
      );

      if (!matchedCount) {
        throw new Error(`user with id: "${user.id}" does not exists`);
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
      const who = await userRepository.getOrFail(userId);

      if (!(await isAssigneeOf(user, who))) {
        // TODO: change when dealing with groups (but to what? maybe add two Ps?)
        throw new httpErrors["Forbidden"]();
      }

      await userRepository.delete(who);

      await teamRepository.arrayPull({ id: user.team }, "members", user.id);
    },
  });

  return new Router({
    prefix: "/user",
  })
    .post("/info", info)
    .post("/update", update)
    .post("/delete", remove);
}
