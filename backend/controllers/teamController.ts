// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { teamSchema, userSchema } from "../schemas/mod.ts";
import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { controller, IAuthorizer, isAssignee } from "../core/mod.ts";
import { reservedTeamInvitation } from "../common/mod.ts";

export function TeamController(
  authorize: IAuthorizer,
  userRepository: UserRepository,
  teamRepository: TeamRepository
) {
  const list = controller({
    status: 200,
    handle: async (ctx: RouterContext) => {
      const user = await authorize(ctx);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      } // every and only teacher is able to view all teams !

      ctx.response.body = await teamRepository.collection
        .find()
        .map(async (team) => ({
          teamId: team.id,
          name: team.name,
          assignee: {
            userId: team.assignee,
            name: (await userRepository.get(team.assignee))?.name, //FIXME n+1
          },
          invitation: isAssignee(team, user)
            ? team.invitation ?? null //FIXME wtf?
            : undefined,
        }))
        .then(Promise.all);
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
      const teamId = await teamRepository.collection
        .findOne(undefined, {
          sort: { id: -1 },
          projection: { id: 1 },
        })
        .then((team) => team?.id! + 1)!;

      await teamRepository.collection.insertOne({
        id: teamId,
        name,
        assignee: user.id,
        members: [],
        invitation: null,
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

      if (!user.isTeacher() && user.team !== teamId) {
        throw new httpErrors["Forbidden"]();
      }

      const team = await teamRepository.getOrFail(teamId);

      const verbosity: 0 | 1 | 2 = !user.isTeacher()
        ? 0
        : isAssignee(team, user)
        ? 2
        : 1;

      ctx.response.body = {
        name: team.name,
        assignee: {
          userId: verbosity >= 1 ? team.assignee : undefined,
          name: (await userRepository.get(team.assignee))?.name,
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
      const team = await teamRepository.getOrFail(teamId);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      }

      if (!isAssignee(team, user)) {
        throw new httpErrors["Forbidden"]();
      }

      if (typeof assignee === "string") {
        if (!(await userRepository.get(assignee))) {
          throw new httpErrors["BadRequest"]("`assignee` doesn't exist");
        }

        await teamRepository.collection.updateOne(
          { id: team.id },
          {
            $set: { assignee },
          }
        );
      }

      if (invitation === "") {
        await teamRepository.collection.updateOne(
          { id: team.id },
          {
            $unset: { invitation: "" },
          }
        );
      } else {
        const ntob = (n: number): string =>
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[n];
        const finalInvitation =
          invitation === reservedTeamInvitation
            ? globalThis.crypto
                .getRandomValues(new Uint8Array(4))
                .reduce((inv, n) => inv + ntob(n % 64), ntob(team.id))
            : invitation;
        const maybeTeam = await teamRepository.collection.findOne({
          invitation: finalInvitation,
        });

        if (invitation !== null && maybeTeam && maybeTeam.id !== team.id) {
          throw new httpErrors["Conflict"]();
        }

        await teamRepository.collection.updateOne(
          { id: team.id },
          {
            $set: { invitation: finalInvitation },
          }
        );
      }

      if (name !== null) {
        await teamRepository.collection.updateOne(
          { id: team.id },
          {
            $set: { name },
          }
        );
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
      const team = await teamRepository.getOrFail(teamId);

      if (!user.isTeacher()) {
        throw new httpErrors["Forbidden"]();
      }

      if (!isAssignee(team, user)) {
        throw new httpErrors["Forbidden"]();
      }

      await Promise.allSettled(
        team.members.map(async (uid) => {
          const user = await userRepository.getOrFail(uid); //FIXME n+1

          await userRepository.delete(user);

          await teamRepository.arrayPull({ id: user.team }, "members", user.id);
        })
      );

      await teamRepository.delete(team);
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
