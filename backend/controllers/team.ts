// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { reservedTeamInvitation } from "../common/mod.ts";
import { teamSchema, userSchema } from "../schemas/mod.ts";
import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { controller, IAuthorizer } from "../core/mod.ts";

export function TeamController(
  authorize: IAuthorizer,
  userRepository: UserRepository,
  teamRepository: TeamRepository
) {
  async function isAssignee(teamId: number, userId: string) {
    return (
      (await userRepository.get(userId).role.get()) === "admin" ||
      (await teamRepository.get(teamId).assignee.get()) === userId
    );
  }
  const list = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx); //! A

      if (!(await user.isTeacher())) {
        throw new httpErrors["Forbidden"]();
      } //! P -- every and only teacher is able to view all teams !

      ctx.response.body = await Promise.all(
        (
          await teamRepository.list()
        ).map(async (e) => ({
          teamId: e.id,
          name: e.name,
          assignee: {
            userId: e.assignee,
            name: await userRepository.get(e.assignee).name.get(),
          },
          invitation: (await isAssignee(e.id, user.id))
            ? e.invitation ?? null //FIXME wtf?
            : undefined,
        }))
      );
    },
  });

  const create = controller({
    schema: {
      body: {
        name: teamSchema.name,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { name } }) => {
      const user = await authorize(ctx); //! A

      if (!(await user.isTeacher())) {
        throw new httpErrors["Forbidden"]();
      } //! P

      const teamId = await teamRepository.add(null, {
        name,
        assignee: user.id,
      }); // ? 404 ? //! EVO
      ctx.response.body = { teamId };
    },
  });

  const info = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { teamId } }) => {
      const user = await authorize(ctx);

      let verbosity: 0 | 1 | 2;

      if (!(await user.isTeacher())) {
        verbosity = 0;

        if ((await user.team.get()) != teamId) {
          throw new httpErrors["Forbidden"]();
        } //! P
      }

      const team = teamRepository.get(teamId);

      if (!(await team.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E

      verbosity ??= (await isAssignee(teamId, user.id)) ? 2 : 1;

      const assignee = await team.assignee.get();

      ctx.response.body = {
        name: await team.name.get(),
        assignee: {
          userId: verbosity >= 1 ? assignee : undefined,
          name: await userRepository.get(assignee).name.get(),
        },
        invitation:
          verbosity >= 2 ? (await team.invitation.get()) ?? null : undefined,
        members: await Promise.all(
          (
            await team.members.get()
          )
            .map((id) => userRepository.get(id))
            .map(async (e) => ({
              userId: verbosity >= 1 ? e.id : undefined,
              name: await e.name.get(),
              number: (await e.number.get()) ?? null,
            }))
        ),
      };
    },
  });

  const update = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
        invitation: teamSchema.invitationGenerateOptional,
        assignee: userSchema.idOptional,
        name: teamSchema.nameOptional,
      },
    },
    status: 200,
    handle: async (
      ctx: RouterContext,
      { body: { teamId, invitation, assignee, name } }
    ) => {
      const user = await authorize(ctx); //! A
      const team = teamRepository.get(teamId);

      if (!(await user.isTeacher())) {
        throw new httpErrors["Forbidden"]();
      } //! P of list

      if (!(await team.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E
      if (!(await isAssignee(teamId, user.id))) {
        throw new httpErrors["Forbidden"]();
      } //! P of update
      if (typeof assignee === "string") {
        if (!(await userRepository.get(assignee).exists())) {
          throw new httpErrors["BadRequest"]("`assignee` doesn't exist");
        } //! V

        await team.assignee.set(assignee);
      }

      if (invitation !== null) {
        let inv = invitation === "" ? undefined : invitation;

        if (inv === reservedTeamInvitation) {
          inv = teamRepository.invitation.create(teamId);
        }

        if (!(await team.invitation.set(inv))) {
          throw new httpErrors["Conflict"]();
        }
      }
      if (name !== null) {
        await team.name.set(name);
      } //! O
    },
  });

  const remove = controller({
    schema: {
      body: {
        teamId: teamSchema.id,
      },
    },
    status: 200,
    handle: async (ctx: RouterContext, { body: { teamId } }) => {
      const user = await authorize(ctx); //! A
      const team = teamRepository.get(teamId);

      if (!(await user.isTeacher())) {
        throw new httpErrors["Forbidden"]();
      } //! P of list

      if (!(await team.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E
      if (!(await isAssignee(teamId, user.id))) {
        throw new httpErrors["Forbidden"]();
      } //! P of delete

      await team.members
        .get()
        .then((uids) =>
          uids.map(async (uid) => {
            await userRepository.delete(userRepository.get(uid));
            const team = teamRepository.get(await user.team.get());

            if (await team.exists()) {
              await team.members.remove(user.id);
            }
          })
        )
        .then(Promise.allSettled);

      await teamRepository.delete(teamId);
    },
  });

  return new Router({
    prefix: "/team",
  })
    .get("/list", list)
    .post("/create", create)
    .post("/info", info)
    .post("/update", update)
    .post("/delete", remove);
}
