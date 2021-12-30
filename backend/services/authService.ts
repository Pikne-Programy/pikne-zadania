import { UserRepository, TeamRepository } from "../repositories/mod.ts";
import {
  JWTService,
  Logger,
  HashService,
  ConfigService,
} from "../services/mod.ts";
import { delay } from "../deps.ts";
import { CustomDictError } from "../common/mod.ts";
import { generateSeed } from "../utils/mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private teamRepository: TeamRepository,
    private jwtService: JWTService,
    private logger: Logger,
    private hashService: HashService,
    private config: ConfigService
  ) {}

  async register({
    invitation,
    number,
    hashedPassword,
    login,
    name,
  }: {
    invitation: string;
    number: number;
    hashedPassword: string;
    login: string;
    name: string;
  }) {
    const team = await this.teamRepository.collection.findOne({ invitation });
    if (!team) {
      throw new CustomDictError("TeamInvitationNotFound", {});
    }
    const id = this.hashService.hash(login);
    const user = {
      id,
      login,
      name,
      number,
      team: team.id,
      dhPassword: await this.hashService.secondhash(hashedPassword),
      role: "student", //? FIXME should it be teacher if admin team
      seed: generateSeed(),
      tokens: [],
      exercises: {},
    };
    if (await this.userRepository.get(id)) {
      throw new CustomDictError("UserAlreadyExists", { userId: id });
    }

    await this.userRepository.collection.insertOne(user);

    // admin team
    if (team.id !== 0) {
      await this.teamRepository.arrayPush(team, "members", id);
    }
  }

  async login({
    hashedPassword,
    login,
  }: {
    hashedPassword: string;
    login: string;
  }) {
    const { LOGIN_TIME } = this.config;
    const startTime = Date.now();

    const delayOnFailure = () => {
      const remainedTime = startTime + LOGIN_TIME - Date.now();
      throw remainedTime > 0 //FIXME proxy responsability?
        ? delay(remainedTime) // * preventing timing attack *
        : this.logger.warn(`WARN: Missed LOGIN_TIME by ${remainedTime} ms.`);
    };

    const token = await this.jwtService
      .create(login, hashedPassword)
      .catch(delayOnFailure);

    return { token };
  }

  async logout({ token }: { token: string }) {
    const user = await this.jwtService.resolve(token);

    await this.jwtService.revoke(user, token);
  }
}
