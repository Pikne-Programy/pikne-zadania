import { IoCContainer, registerToken } from "./core/ioc/mod.ts";
import { DatabaseDriver } from "./drivers/mod.ts";
import {
  ExerciseRepository,
  SubjectRepository,
  TeamRepository,
  UserRepository,
} from "./repositories/mod.ts";
import {
  AuthService,
  ConfigService,
  ExerciseService,
  HashService,
  JWTService,
  Logger,
  ProblemService,
  SubjectService,
  TeamService,
  UserService,
} from "./services/mod.ts";
import {
  AuthController,
  ExerciseController,
  ProblemController,
  SubjectController,
  TeamController,
  UserController,
} from "./controllers/mod.ts";
import { TokenAuthController } from "./controllers/auth/mod.ts";

registerToken(ConfigService, "config"); //FIXME

export const module = () =>
  new IoCContainer()
    //global layer is available everywhere
    .globalLayer([ConfigService, Logger])
    .registerLayer("drivers", [DatabaseDriver])
    .registerLayer("repositories", [
      ExerciseRepository,
      TeamRepository,
      UserRepository,
      SubjectRepository,
    ])
    .registerLayer("services", [
      JWTService,
      HashService,
      TeamService,
      SubjectService,
      ProblemService,
      ExerciseService,
      AuthService,
      UserService,
    ])
    .registerLayer("controllers", [
      TokenAuthController, //this is routes factory
      //
      AuthController,
      TeamController,
      UserController,
      SubjectController,
      ExerciseController,
      ProblemController,
    ]);
