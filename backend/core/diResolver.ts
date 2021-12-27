import {
  ConfigService,
  DatabaseService,
  ExerciseService,
  JWTService,
  Logger,
  HashService,
} from "../services/mod.ts";
import {
  ExerciseRepository,
  SubjectRepository,
  TeamRepository,
  UserRepository,
} from "../repositories/mod.ts";
import {
  AuthController,
  SubjectController,
  TeamController,
  UserController,
  ExerciseController,
} from "../controllers/mod.ts";
import { Team, Subject, User } from "../models/mod.ts";
import { createAuthorize, createApiRoutes } from "./mod.ts";

export async function resolveIoC() {
  const config = new ConfigService();
  const logger = new Logger(config);
  const hashService = new HashService(config);

  const dbService = await new DatabaseService(config).connect();

  const teamRepository = new TeamRepository(
    hashService,
    dbService.getCollection<Team>("teams")
  );
  const userRepository = new UserRepository(
    config,
    dbService.getCollection<User>("users"),
    logger,
    hashService
  );
  const subjectRepository = new SubjectRepository(
    dbService.getCollection<Subject>("subjects")
  );
  const exerciseRepository = new ExerciseRepository(config, logger);

  await Promise.all([
    teamRepository.init(),
    userRepository.init((await teamRepository.get(0))!),
    exerciseRepository.init(),
    subjectRepository.init(exerciseRepository.listSubjects()),
  ]);

  const exerciseService = new ExerciseService(
    exerciseRepository,
    userRepository
  );
  const jwtService = new JWTService(
    config,
    userRepository,
    logger,
    hashService
  );

  const authorizer = createAuthorize(jwtService, userRepository);

  const authController = AuthController(
    config,
    userRepository,
    teamRepository,
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
  const exerciseController = ExerciseController(
    authorizer,
    subjectRepository,
    exerciseRepository
  );

  const router = createApiRoutes(
    authController,
    subjectController,
    exerciseController,
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
