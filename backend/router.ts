import { Router } from "./deps.ts";
import { seed } from "./middleware/seedMiddleware.ts";
import exercisesController from "./controllers/exercisesController.ts";
import authController from "./controllers/authController.ts";

const router = new Router();

router
  .get("/api", (ctx) => {
    ctx.response.status = 200;
    ctx.response.body = {};
  })
  .get("/api/public", exercisesController.list.bind(exercisesController))
  .get(
    "/api/public/:subject/:id",
    seed,
    exercisesController.get.bind(exercisesController),
  )
  .post(
    "/api/public/:subject/:id",
    seed,
    exercisesController.check.bind(exercisesController),
  )
  .get(
    "/api/public/:subject/static/:file",
    exercisesController.getStaticContent.bind(exercisesController),
  )
  .post(
    "/api/register",
    authController.register.bind(authController),
  )
  .post(
    "/api/login",
    authController.login.bind(authController),
  )
  .post(
    "/api/login",
    authController.logout.bind(authController),
  )
  .get(
    "/api/account",
    authController.getAccount.bind(authController),
  )
  .get(
    "/api/teams",
    authController.getTeams.bind(authController),
  )
  .post(
    "/api/teams",
    authController.createTeam.bind(authController),
  )
  .post(
    "/api/teams/:id/open",
    authController.openReg.bind(authController),
  )
  .post(
    "/api/teams/:id/close",
    authController.closeReg.bind(authController),
  )
  .get(
    "/api/teams/:id",
    authController.teamInfo.bind(authController),
  )
  .delete(
    "/api/teams/:id/:userid",
    authController.deleteUser.bind(authController),
  )
  .post(
    "/api/teams/:id/:userid",
    authController.addUser.bind(authController),
  )
  .post(
    "/api/teams/:id",
    authController.setTeamName.bind(authController),
  )
  .post(
    "/api/root/teams/:id",
    authController.changeAssignee.bind(authController),
  );

export default router;
