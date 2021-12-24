// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { httpErrors, Router, RouterContext } from "../deps.ts";
import { translateErrors } from "../utils/mod.ts";
import { reservedTeamInvitation, schemas } from "../types/mod.ts";
import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { IAuthorizer } from "./mod.ts";
import { ValidatorMiddleware } from "../middlewares/mod.ts";

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

  async function list(ctx: RouterContext) {
    const user = await authorize(ctx); //! A

    if (!["admin", "teacher"].includes(await user.role.get())) {
      // TODO: user.isTeacher
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

    ctx.response.status = 200; //! D
  }

  const create = ValidatorMiddleware(
    {
      name: schemas.team.name,
    },
    async (ctx: RouterContext, { name }) => {
      const user = await authorize(ctx); //! A

      if (!["admin", "teacher"].includes(await user.role.get())) {
        // TODO: user.isTeacher
        throw new httpErrors["Forbidden"]();
      } //! P

      const teamId = translateErrors(
        await teamRepository.add(null, { name, assignee: user.id }) // ? 404 ?
      ); //! EVO

      ctx.response.body = { teamId };
      ctx.response.status = 200; //! D
    }
  );

  const info = ValidatorMiddleware(
    {
      teamId: schemas.team.id,
    },
    async (ctx: RouterContext, { teamId }) => {
      const user = await authorize(ctx); //! A
      const role = await user.role.get();

      let verbosity: 0 | 1 | 2;

      if (!["admin", "teacher"].includes(role)) {
        // TODO: user.isTeacher
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

      ctx.response.status = 200; //! D
    }
  );

  const update = ValidatorMiddleware(
    {
      teamId: schemas.team.id,
      invitation: schemas.team.invitationGenerateOptional,
      assignee: schemas.user.idOptional,
      name: schemas.team.nameOptional,
    },
    async (ctx: RouterContext, { teamId, invitation, assignee, name }) => {
      const user = await authorize(ctx); //! A
      const team = teamRepository.get(teamId);

      if (!["admin", "teacher"].includes(await user.role.get())) {
        // TODO: user.isTeacher
        throw new httpErrors["Forbidden"]();
      } //! P of list

      if (!(await team.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E
      if (!(await isAssignee(teamId, user.id))) {
        throw new httpErrors["Forbidden"]();
      } //! P of update
      if (assignee !== null) {
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

      ctx.response.status = 200; //! D
    }
  );

  const remove = ValidatorMiddleware(
    {
      teamId: schemas.team.id,
    },
    async (ctx: RouterContext, { teamId }) => {
      const user = await authorize(ctx); //! A
      const team = teamRepository.get(teamId);

      if (!["admin", "teacher"].includes(await user.role.get())) {
        // TODO: user.isTeacher
        throw new httpErrors["Forbidden"]();
      } //! P of list

      if (!(await team.exists())) {
        throw new httpErrors["NotFound"]();
      } //! E
      if (!(await isAssignee(teamId, user.id))) {
        throw new httpErrors["Forbidden"]();
      } //! P of delete

      await teamRepository.delete(teamId); // * Error not handled //! O

      ctx.response.status = 200; //! D
    }
  );

  return new Router({
    prefix: "/team",
  })
    .get("/list", list)
    .post("/create", create)
    .post("/info", info)
    .post("/update", update)
    .post("/delete", remove);
}
