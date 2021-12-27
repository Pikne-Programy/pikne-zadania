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
      (await userRepository.get(userId))?.role === "admin" ||
      (await teamRepository.get(teamId))?.assignee === userId
    );
  }

  const list = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      } // every and only teacher is able to view all teams !

      ctx.response.body = await Promise.all(
        (
          await teamRepository.list()
        ).map(async (team) => ({
          teamId: team.id,
          name: team.name,
          assignee: {
            userId: team.assignee,
            name: (await userRepository.get(team.assignee))?.name, //FIXME n+1
          },
          invitation: (await isAssignee(team.id, user.id))
            ? team.invitation ?? null //FIXME wtf?
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
      const user = await authorize(ctx);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      }

      const teamId = await teamRepository.add(null, {
        name,
        assignee: user.id,
      });

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

      if (!user.isTeacher()) {
        verbosity = 0;

        if (user.team != teamId) {
          throw new httpErrors["Forbidden"]();
        }
      }

      const team = await teamRepository.get(teamId);

      if (!team) {
        throw new httpErrors["NotFound"]();
      } //! E

      verbosity ??= (await isAssignee(teamId, user.id)) ? 2 : 1;

      const assignee = team.assignee;

      ctx.response.body = {
        name: team.name,
        assignee: {
          userId: verbosity >= 1 ? assignee : undefined,
          name: (await userRepository.get(assignee))?.name,
        },
        invitation: verbosity >= 2 ? team.invitation ?? null : undefined,
        members: await Promise.all(
          team.members.map((id) =>
            userRepository
              .get(id) //FIXME n+1
              .then((user) => ({
                userId: verbosity >= 1 ? user?.id : undefined,
                name: user?.name,
                number: user?.number ?? null,
              }))
          )
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
      const user = await authorize(ctx);
      const team = await teamRepository.get(teamId);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      }

      if (!team) {
        throw new httpErrors["NotFound"]();
      }
      if (!(await isAssignee(teamId, user.id))) {
        throw new httpErrors["Forbidden"]();
      }
      if (typeof assignee === "string") {
        if (!(await userRepository.get(assignee))) {
          throw new httpErrors["BadRequest"]("`assignee` doesn't exist");
        }
        await teamRepository.set(team, "assignee", assignee);
      }

      if (invitation !== null) {
        let inv = invitation === "" ? undefined : invitation;
        const invits = teamRepository.invitationFor(team);

        if (inv === reservedTeamInvitation) {
          inv = invits.create(teamId);
        }

        if (!(await invits.set(inv))) {
          throw new httpErrors["Conflict"]();
        }
      }
      if (name !== null) {
        await teamRepository.set(team, "name", "name");
      }
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
      const user = await authorize(ctx);
      const team = await teamRepository.get(teamId);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      }

      if (!team) {
        throw new httpErrors["NotFound"]();
      }
      if (!(await isAssignee(teamId, user.id))) {
        throw new httpErrors["Forbidden"]();
      }

      await Promise.allSettled(
        team.members.map(async (uid) => {
          const user = await userRepository.get(uid);
          if (!user) {
            return;
          }
          await userRepository.delete(user);
          const team = await teamRepository.get(await user.team);

          if (team) {
            teamRepository.membersFor(team).remove(user.id);
          }
        })
      );

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
