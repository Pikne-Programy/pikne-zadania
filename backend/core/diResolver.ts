import {
  ConfigService,
  JWTService,
  Logger,
  HashService,
  UserService,
  TeamService,
  SubjectService,
  ProblemService,
  ExerciseService,
  AuthService,
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

  const jwtService = new JWTService(config, userRepository, hashService);

  const userService = new UserService(userRepository, teamRepository);
  const teamService = new TeamService(userRepository, teamRepository);
  const subjectService = new SubjectService(
    userRepository,
    subjectRepository,
    exerciseRepository
  );
  const problemService = new ProblemService(
    subjectRepository,
    exerciseRepository,
    userRepository
  );
  const exerciseService = new ExerciseService(
    subjectRepository,
    exerciseRepository
  );
  const authService = new AuthService(
    userRepository,
    teamRepository,
    jwtService,
    logger,
    hashService,
    config
  );

  const authorizer = createAuthorize(jwtService);

  const authController = AuthController(config, authService);
  const teamController = TeamController(authorizer, teamService);
  const userController = UserController(authorizer, userService);
  const subjectController = SubjectController(authorizer, subjectService);
  const exerciseController = ExerciseController(authorizer, exerciseService);
  const problemController = ProblemController(
    authorizer,
    config,
    problemService
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
