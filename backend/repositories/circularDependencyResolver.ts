import { ConfigService, Logger } from "../services/mod.ts";
import { TeamRepository, UserRepository } from "../repositories/mod.ts";
import { UserType, TeamType } from "../types/mod.ts";
import { Collection } from "../deps.ts";

export interface CircularDependencies {
  teamRepository: TeamRepository;
  userRepository: UserRepository;
}

//FIXME Remove as fast as possible?
export function CircularDependencyResolver(
  config: ConfigService,
  usersCollection: Collection<UserType>,
  teamsCollection: Collection<TeamType>,
  logger: Logger,
  _teamRepository: typeof TeamRepository,
  _userRepository: typeof UserRepository
) {
  const self: CircularDependencies = {} as CircularDependencies;

  self.teamRepository = new _teamRepository(config, teamsCollection, self);
  self.userRepository = new _userRepository(
    config,
    usersCollection,
    logger,
    self
  );

  return self;
}
