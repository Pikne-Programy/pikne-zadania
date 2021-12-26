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
  async function isAssigneeOf(assignee: User, who: User) {
    // * assuming `assignee` exists
    if ((await assignee.role.get()) === "admin") {
      return true;
    }
    if (!(await who.exists())) {
      return false;
    }
    const team = teamRepository.get(await who.team.get());

    return (await team.exists()) && assignee.id === (await team.assignee.get());
  }

  const info = controller({
    schema: {
      body: {
        userId: userSchema.idOptional,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body }) => {
      let { userId } = body;
      const user = await authorize(ctx); //! A

      if (userId === null) {
        userId = user.id;
      } //! R

      const who = userRepository.get(userId);

      if (
        userId !== user.id && // not themself and
        !(await isAssigneeOf(user, who)) // member of not their team // TODO: change when dealing with groups (but to what?)
      ) {
        throw new httpErrors["Forbidden"]();
      } //! P

      if (!(await who.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E

      ctx.response.body = {
        name: await who.name.get(),
        teamId: await who.team.get(),
        number: (await who.number.get()) ?? null,
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
      const who = userRepository.get(userId);

      if (
        // ? themself ?
        !(await isAssigneeOf(user, who)) // member of not their team // TODO: change when dealing with groups (but to what? maybe add two Ps?)
      ) {
        throw new httpErrors["Forbidden"]();
      } //! P

      if (!(await who.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E
      if (number !== null) {
        await who.number.set(isNaN(number) ? undefined : number);
      }
      //! V already in schemas
      if (name !== null) {
        await who.name.set(name);
      } //! O
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
      const user = await authorize(ctx); //! A
      const who = userRepository.get(userId);

      // ? themself ?
      // member of not their team
      // TODO: change when dealing with groups (but to what? maybe add two Ps?)
      if (!(await isAssigneeOf(user, who))) {
        throw new httpErrors["Forbidden"]();
      } //! P

      await userRepository.delete(userId); //! EO
    },
  });

  return new Router({
    prefix: "/user",
  })
    .post("/info", info)
    .post("/update", update)
    .post("/delete", remove);
}
