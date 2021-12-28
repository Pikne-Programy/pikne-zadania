import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { User, Team } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";
import { isAssignee } from "../core/mod.ts";
import { reservedTeamInvitation } from "../common/mod.ts";

export class TeamService {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository
  ) {}

  async findOne(currentUser: User, { teamId }: { teamId: Team["id"] }) {
    if (!currentUser.isTeacher() && currentUser.team !== teamId) {
      throw new httpErrors["Forbidden"]();
    }

    const team = await this.teamRepository.getOrFail(teamId);

    const verbosity: 0 | 1 | 2 = !currentUser.isTeacher()
      ? 0
      : isAssignee(team, currentUser)
      ? 2
      : 1;

    return {
      name: team.name,
      assignee: {
        userId: verbosity >= 1 ? team.assignee : undefined,
        name: (await this.userRepository.get(team.assignee))?.name,
      },
      invitation: verbosity >= 2 ? team.invitation ?? null : undefined,
      members: await Promise.all(
        team.members.map((id) =>
          this.userRepository
            .get(id) //FIXME n+1
            .then((user) => ({
              userId: verbosity >= 1 ? user?.id : undefined,
              name: user?.name,
              number: user?.number ?? null,
            }))
        )
      ),
    };
  }

  findAll(currentUser: User) {
    if (!currentUser.isTeacher()) {
      throw new httpErrors["Forbidden"]();
    } // every and only teacher is able to view all teams !

    return this.teamRepository.collection
      .find()
      .map(async (team) => ({
        teamId: team.id,
        name: team.name,
        assignee: {
          userId: team.assignee,
          name: (await this.userRepository.get(team.assignee))?.name, //FIXME n+1
        },
        invitation: isAssignee(team, currentUser)
          ? team.invitation ?? null //FIXME wtf?
          : undefined,
      }))
      .then(Promise.all);
  }

  async create(currentUser: User, { name }: { name: string }) {
    if (!currentUser.isTeacher()) {
      throw new httpErrors["Forbidden"]();
    }
    const teamId = await this.teamRepository.collection
      .findOne(undefined, {
        sort: { id: -1 },
        projection: { id: 1 },
      })
      .then((team) => team?.id! + 1)!;

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
      assignee: string;
      invitation: string | null;
      name: string | null;
    }
  ) {
    const team = await this.teamRepository.getOrFail(teamId);

    if (!currentUser.isTeacher()) {
      throw new httpErrors["Forbidden"]();
    }

    if (!isAssignee(team, currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    if (typeof assignee === "string") {
      if (!(await this.userRepository.get(assignee))) {
        throw new httpErrors["BadRequest"]("`assignee` doesn't exist");
      }

      await this.teamRepository.collection.updateOne(
        { id: team.id },
        {
          $set: { assignee },
        }
      );
    }

    if (invitation === "") {
      await this.teamRepository.collection.updateOne(
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
        }
      );
    }

    if (name !== null) {
      await this.teamRepository.collection.updateOne(
        { id: team.id },
        {
          $set: { name },
        }
      );
    }
  }

  async delete(
    currentUser: User,
    {
      teamId,
    }: {
      teamId: Team["id"];
    }
  ) {
    const team = await this.teamRepository.getOrFail(teamId);

    if (!currentUser.isTeacher()) {
      throw new httpErrors["Forbidden"]();
    }

    if (!isAssignee(team, currentUser)) {
      throw new httpErrors["Forbidden"]();
    }

    await Promise.allSettled(
      team.members.map(async (uid) => {
        const user = await this.userRepository.getOrFail(uid); //FIXME n+1

        await this.userRepository.delete(user);

        await this.teamRepository.arrayPull(
          { id: user.team },
          "members",
          user.id
        );
      })
    );

    await this.teamRepository.delete(team);
  }
}
