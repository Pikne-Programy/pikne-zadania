import {
  ConfigService,
  DatabaseService,
  ExerciseService,
  JWTService,
  Logger,
} from "../services/mod.ts";
import {
  ExerciseRepository,
  CircularDependencyResolver,
  SubjectRepository,
  TeamRepository,
  UserRepository,
} from "../repositories/mod.ts";
import {
  AuthController,
  SubjectController,
  TeamController,
  UserController,
} from "../controllers/mod.ts";
import { TeamType, SubjectType, UserType } from "../models/mod.ts";
import { createAuthorize, createApiRoutes } from "./mod.ts";

export async function resolveIoC() {
  const config = new ConfigService();
  const logger = new Logger(config);

  const dbService = await new DatabaseService(config).connect();

  const usersCollection = dbService.getCollection<UserType>("users");
  const teamsCollection = dbService.getCollection<TeamType>("teams");
  const subjectsCollection = dbService.getCollection<SubjectType>("subjects");

  const { userRepository, teamRepository } = CircularDependencyResolver(
    config,
    usersCollection,
    teamsCollection,
    logger,
    TeamRepository,
    UserRepository
  );
  const exerciseRepository = new ExerciseRepository(config, logger);
  const subjectRepository = new SubjectRepository(
    subjectsCollection,
    exerciseRepository
  );

  await Promise.all([
    userRepository.init(),
    teamRepository.init(),
    subjectRepository.init(),
  ]);

  const exerciseService = new ExerciseService(exerciseRepository);
  const jwtService = new JWTService(config, userRepository, logger);

  const authorizer = createAuthorize(jwtService, userRepository);

  const authController = AuthController(
    config,
    userRepository,
    jwtService,
    logger
  );
  const teamController = TeamController(
    authorizer,
    userRepository,
    teamRepository
  );
  const userController = UserController(
    authorizer,
    userRepository,
    teamRepository
  );
  const subjectController = SubjectController(
    authorizer,
    config,
    userRepository,
    subjectRepository,
    exerciseRepository,
    exerciseService
  );

  const router = createApiRoutes(
    authController,
    subjectController,
    teamController,
    userController
  );

  return {
    router,
    logger,
    config,
    dropExercises: () => exerciseRepository.drop(),
    dropDb: () => dbService.drop(),
    closeDb: () => dbService.close(),
  };
}
