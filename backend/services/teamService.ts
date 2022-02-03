import { TeamRepository, UserRepository } from "../repositories/mod.ts";
import { Team, User } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";
import { Injectable } from "../core/ioc/mod.ts";
import type { onInit } from "../core/types/mod.ts";
import {
  Actions,
  reservedTeamInvitation,
  TEACHER_TEAM,
} from "../common/mod.ts";
import { HashService } from "./mod.ts";

@Injectable()
export class TeamService implements onInit {
  constructor(
    private hashService: HashService,
    private userRepository: UserRepository,
    private teamRepository: TeamRepository,
  ) {}

  async findOne(currentUser: User, { teamId }: { teamId: Team["id"] }) {
    currentUser.assertCan(Actions.READ, { id: teamId } as Team, "id");

    const team = await this.teamRepository.getOrFail(teamId);

    const verbosity = currentUser.cannot(Actions.READ_PARTIAL_INFO, new Team())
      ? 0
      : currentUser.can(Actions.READ_FULL_INFO, team)
      ? 2
      : 1;

    return {
      name: team.name,
      assignee: {
        userId: verbosity > 0 ? team.assignee : undefined,
        name: (await this.userRepository.get(team.assignee))?.name,
      },
      invitation: verbosity === 2 ? team.invitation ?? null : undefined,
      members: await Promise.all(
        team.members.map((id) =>
          this.userRepository
            .get(id) //FIXME n+1
            .then((user) => ({
              userId: verbosity > 0 ? user?.id : undefined,
              name: user?.name,
              number: user?.number ?? null,
            }))
        ),
      ),
    };
  }

  findAll(currentUser: User) {
    // every and only teacher is able to view all teams !
    currentUser.assertCan(Actions.READ, new Team());

    return this.teamRepository.collection
      .find()
      .map(async (team) => ({
        teamId: team.id,
        name: team.name,
        assignee: {
          userId: team.assignee,
          name: (await this.userRepository.get(team.assignee))?.name, //FIXME n+1
        },
        invitation: currentUser.can(Actions.READ_INVITATION, team)
          ? team.invitation ?? null
          : undefined,
      }))
      .then(Promise.all);
  }

  async create(currentUser: User, { name }: { name: string }) {
    currentUser.assertCan(Actions.CREATE, new Team());

    const teamId = await this.teamRepository.collection
      .findOne(undefined, {
        sort: { id: -1 },
        projection: { id: 1 },
      })
      .then((team) => team!.id + 1)!;

    await this.teamRepository.collection.insertOne({
      id: teamId,
      name,
      assignee: currentUser.id,
      members: [],
      invitation: null,
    });

    return { teamId };
  }

  async update(
    currentUser: User,
    {
      teamId,
      assignee,
      invitation,
      name,
    }: {
      teamId: Team["id"];
      assignee: string | null;
      invitation: string | null;
      name: string | null;
    },
  ) {
    const team = await this.teamRepository.getOrFail(teamId);

    currentUser.assertCan(Actions.CREATE, team);

    if (typeof assignee === "string") {
      if (!(await this.userRepository.get(assignee))) {
        //FIXME ?404 instead?
        throw new httpErrors["BadRequest"]("`assignee` doesn't exist");
      }

      await this.teamRepository.collection.updateOne(
        { id: team.id },
        {
          $set: { assignee },
        },
      );
    }

    if (invitation === "") {
      await this.teamRepository.collection.updateOne(
        { id: team.id },
        {
          $unset: { invitation: "" },
        },
      );
    } else {
      const ntob = (n: number): string =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[n];
      const finalInvitation = invitation === reservedTeamInvitation
        ? globalThis.crypto
          .getRandomValues(new Uint8Array(4))
          .reduce((inv, n) => inv + ntob(n % 64), ntob(team.id))
        : invitation;
      const maybeTeam = await this.teamRepository.collection.findOne({
        invitation: finalInvitation,
      });

      if (invitation !== null && maybeTeam && maybeTeam.id !== team.id) {
        throw new httpErrors["Conflict"]();
      }

      await this.teamRepository.collection.updateOne(
        { id: team.id },
        {
          $set: { invitation: finalInvitation },
        },
      );
    }

    if (name !== null) {
      await this.teamRepository.collection.updateOne(
        { id: team.id },
        {
          $set: { name },
        },
      );
    }
  }

  async delete(
    currentUser: User,
    {
      teamId,
    }: {
      teamId: Team["id"];
    },
  ) {
    const team = await this.teamRepository.getOrFail(teamId);

    currentUser.assertCan(Actions.DELETE, team);

    await Promise.allSettled(
      team.members.map(async (uid) => {
        const user = await this.userRepository.getOrFail(uid); //FIXME n+1

        await this.userRepository.delete(user);

        await this.teamRepository.arrayPull(
          { id: user.team },
          "members",
          user.id,
        );
      }),
    );

    await this.teamRepository.delete(team);
  }
  async init() {
    // create static teachers' team if not already created
    if (await this.teamRepository.get(TEACHER_TEAM)) {
      return;
    }

    await this.teamRepository.collection.insertOne({
      id: TEACHER_TEAM,
      name: "Teachers",
      // teachers' team
      assignee: this.hashService.hash("root"),
      members: [],
      invitation: null,
    });
  }
}
