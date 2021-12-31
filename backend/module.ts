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
  Authorizer,
  ExerciseController,
  ProblemController,
  SubjectController,
  TeamController,
  UserController,
} from "./controllers/mod.ts";

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
      Authorizer,
      //
      AuthController,
      TeamController,
      UserController,
      SubjectController,
      ExerciseController,
      ProblemController,
    ]);
