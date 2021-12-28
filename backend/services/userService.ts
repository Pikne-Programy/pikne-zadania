import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import { User } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository
  ) {}

  //FIXME lol second version of this
  private async isAssigneeOf(assignee: User, who?: User) {
    // * assuming `assignee` exists
    if (assignee.role === "admin") {
      return true;
    }
    if (!who) {
      return false;
    }
    const team = await this.teamRepository.get(who.team);

    return team && assignee.id === team.assignee;
  }

  async findOne(
    currentUser: User,
    { userId: targetId }: { userId?: User["id"] }
  ) {
    const userId = targetId || currentUser.id;

    const who = await this.userRepository.getOrFail(userId);

    if (
      userId === currentUser.id || // themself or
      (await this.isAssigneeOf(currentUser, who)) // member of their team // TODO: change when dealing with groups (but to what?)
    ) {
      throw new httpErrors["Forbidden"]();
    }
    return {
      name: who.name,
      teamId: who.team,
      number: who.number ?? null,
    };
  }

  async update(
    currentUser: User,
    {
      userId,
      number,
      name,
    }: { userId: User["id"]; number: number | null; name: string | null }
  ) {
    const who = await this.userRepository.getOrFail(userId);

    // member of not their team // TODO: change when dealing with groups (but to what? maybe add two Ps?)
    if (!(await this.isAssigneeOf(currentUser, who))) {
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

    const { matchedCount } = await this.userRepository.collection.updateOne(
      {
        id: userId,
      },
      query
    );

    if (!matchedCount) {
      throw new Error(`user with id: "${userId}" does not exists`);
    }
  }

  async delete(currentUser: User, userId: string) {
    const who = await this.userRepository.getOrFail(userId);

    if (!(await this.isAssigneeOf(currentUser, who))) {
      // TODO: change when dealing with groups (but to what? maybe add two Ps?)
      throw new httpErrors["Forbidden"]();
    }

    await this.userRepository.delete(who);

    await this.teamRepository.arrayPull(
      { id: currentUser.team },
      "members",
      currentUser.id
    );
  }
}
