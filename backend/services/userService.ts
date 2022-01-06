import { TeamRepository, UserRepository } from "../repositories/mod.ts";
import { User, UserRole } from "../models/mod.ts";
import { httpErrors } from "../deps.ts";
import { Injectable } from "../core/ioc/mod.ts";
import { generateSeed } from "../utils/mod.ts";
import { ConfigService, HashService, Logger } from "./mod.ts";

@Injectable()
export class UserService {
  constructor(
    private logger: Logger,
    private hashService: HashService,
    private configService: ConfigService,
    private userRepository: UserRepository,
    private teamRepository: TeamRepository,
  ) {}

  //FIXME move to permissions
  private async isAssigneeOf(assignee: User, who: User) {
    return (
      assignee.role === UserRole.ADMIN ||
      assignee.id ===
        (await this.teamRepository.get(who.team).then((team) => team?.assignee))
    );
  }

  async findOne(
    currentUser: User,
    { userId: targetId }: { userId?: User["id"] },
  ) {
    const userId = targetId || currentUser.id;

    const who = await this.userRepository.getOrFail(userId);

    if (
      who.id !== currentUser.id && // not themself and
      !(await this.isAssigneeOf(currentUser, who)) // member of not their team // TODO: change when dealing with groups (but to what?)
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
    }: { userId: User["id"]; number: number | null; name: string | null },
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
        name !== null && { name },
      ),
      $unset: Object.assign({}, !isNumber && { number }),
    };

    const { matchedCount } = await this.userRepository.collection.updateOne(
      {
        id: userId,
      },
      query,
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
      currentUser.id,
    );
  }
  async init() {
    const warn = (
      what: string,
      why = "Please unset it or change ROOT_ENABLE.",
    ) => this.logger.warn(`WARN: ${what} is present. ${why}`);

    const addRoot = async (dhPassword: string) => {
      const user = {
        id: this.hashService.hash("root"),
        login: "root",
        name: "root",
        team: 0,
        dhPassword,
        role: UserRole.ADMIN,
        seed: generateSeed(),
        tokens: [],
        exercises: {},
      };

      await this.userRepository.collection.updateOne({ id: user.id }, user, {
        upsert: true,
      });
    };

    const root = await this.userRepository.get(this.hashService.hash("root"));
    const config = this.configService.ROOT_CONF;

    if (!config.enable) {
      if (config.password) {
        warn("ROOT_PASS");
      }
      if (config.dhPassword) {
        warn("ROOT_DHPASS");
      }
      if (root) {
        await this.userRepository.delete(root);
      }
      return;
    }

    warn("ROOT_ENABLE", "It can be a security issue.");

    if (config.dhPassword) {
      if (config.password) {
        warn("ROOT_PASS");
      }

      if (root?.dhPassword == config.dhPassword) {
        this.logger.log("ROOT was not changed.");
      } else {
        await addRoot(config.dhPassword);

        this.logger.warn("ROOT was registered with ROOT_DHPASS.");
      }
    } else {
      if (!config.password && !root) {
        throw new Error("no credentials for root");
      }

      if (!config.password) {
        return;
      }

      this.logger.log(new Date(), "Generating root password hash...");

      const dhPassword = this.hashService.secondhashSync(
        this.hashService.firsthash("root", config.password),
      );

      this.logger
        .log(new Date(), "Generated!")
        .warn(
          `Please unset ROOT_PASS!\nSet ROOT_DHPASS=${dhPassword} if needed.`,
        );

      await addRoot(dhPassword);

      this.logger.warn("ROOT was registered with ROOT_PASS.");
    }
  }
}
