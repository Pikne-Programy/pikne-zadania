import { Router } from "./deps.ts";
import { seed } from "./middleware/seedMiddleware.ts";
import ExercisesController from "./controllers/exercisesController.ts";
import { placeholder } from "./utils/mod.ts";

const router = new Router();
router
  .get("/api", placeholder(200, {}))
  .get("/api/public", ExercisesController.list)
  .get("/api/public/:subject/:id", seed, ExercisesController.get)
  .post("/api/public/:subject/:id", seed, ExercisesController.check)
  .get(
    "/api/public/:subject/static/:file",
    ExercisesController.getStaticContent,
  )
  .post("/api/register", placeholder(201))
  .post("/api/login", placeholder(200))
  .post("/api/logout", placeholder(200))
  .get(
    "/api/account",
    placeholder(200, { "name": "User", "number": 11, "team": 1 }),
  )
  .get(
    "/api/teams",
    placeholder(200, [
      { "id": 1, "name": "Teachers", "assignee": "Smith", "open": true },
      { "id": 2, "name": "2d", "assignee": "Williams", "open": true },
      { "id": 3, "name": "3d", "assignee": "Williams", "open": false },
    ]),
  )
  .post("/api/teams", placeholder(200, 4))
  .post("/api/teams/:id/open", placeholder(200))
  .post("/api/teams/:id/close", placeholder(200))
  .get(
    "/api/teams/:id",
    placeholder(200, {
      "name": "2d",
      "assignee": "Williams",
      "members": [{
        "id":
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "name": "User",
        "number": 11,
      }],
    }),
  )
  .delete("/api/teams/:id/:userid", placeholder(200))
  .post("/api/teams/:id/:userid", placeholder(200))
  .post("/api/teams/:id", placeholder(200))
  .post("/api/root/teams/:id", placeholder(200));

export default router;
