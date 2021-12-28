import {
  ConfigService,
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
  ProblemController,
} from "../controllers/mod.ts";
import { Team, Subject, User } from "../models/mod.ts";
import { DatabaseDriver, createAuthorize, createApiRoutes } from "./mod.ts";

export async function resolveIoC() {
  const config = new ConfigService();
  const logger = new Logger(config);
  const hashService = new HashService(config);

  const db = await new DatabaseDriver(config).connect();

  const teamRepository = new TeamRepository(
    hashService,
    db.getCollection<Team>("teams")
  );
  const userRepository = new UserRepository(
    db.getCollection<User>("users"),
    logger,
    hashService
  );
  const subjectRepository = new SubjectRepository(
    db.getCollection<Subject>("subjects")
  );
  const exerciseRepository = new ExerciseRepository(config, logger);

  await Promise.all([
    teamRepository.init(),
    userRepository.init(config),
    exerciseRepository.init(),
    subjectRepository.init(exerciseRepository.listSubjects()),
  ]);

  const jwtService = new JWTService(
    config,
    userRepository,
    logger,
    hashService
  );

  const authorizer = createAuthorize(jwtService);

  const authController = AuthController(
    config,
    userRepository,
    teamRepository,
    jwtService,
    logger,
    hashService
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
    userRepository,
    subjectRepository,
    exerciseRepository
  );
  const exerciseController = ExerciseController(
    authorizer,
    subjectRepository,
    exerciseRepository
  );
  const problemController = ProblemController(
    authorizer,
    config,
    subjectRepository,
    exerciseRepository,
    userRepository
  );

  const router = createApiRoutes(
    authController,
    subjectController,
    exerciseController,
    teamController,
    userController,
    problemController
  );

  return {
    router,
    logger,
    config,
    dropExercises: () => exerciseRepository.drop(),
    dropDb: () => db.drop(),
    closeDb: () => db.close(),
  };
}
