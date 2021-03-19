import { Router } from "./deps.ts";
import { seed } from "./middleware/seed.ts";
import { authNotReq, authReq } from "./middleware/auth.ts";
import { Auth, Exercises, Teams, Users } from "./controllers/mod.ts";
import { placeholder } from "./utils/mod.ts";

const router = new Router();
router
  .get("/api", placeholder(200, {}))
  .get("/api/public", authNotReq, Exercises.list)
  .get("/api/public/:subject/:id", authNotReq, seed, Exercises.get)
  .post("/api/public/:subject/:id", authNotReq, seed, Exercises.check)
  .get("/api/public/:subject/static/:file", Exercises.getStaticContent)
  .post("/api/register", Auth.register)
  .post("/api/login", Auth.login)
  .post("/api/logout", authReq, Auth.logout)
  .get("/api/account", authReq, Users.getUser)
  .get("/api/teams", authReq, Teams.getAllTeams)
  .post("/api/teams", authReq, Teams.addTeam)
  .post("/api/teams/:id/open", authReq, Teams.openRegistration)
  .post("/api/teams/:id/close", authReq, Teams.closeRegistration)
  .get("/api/teams/:id", authReq, Teams.getTeam)
  .delete("/api/teams/:id/:userid", authReq, Users.deleteUser)
  .post("/api/teams/:id/:userid", authReq, Users.setUserNumber)
  .post("/api/teams/:id", authReq, Teams.setTeamName)
  .post("/api/root/teams/:id", authReq, Teams.changeAssignee);

export default router;
