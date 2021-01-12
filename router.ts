import { Router } from "./deps.ts";
import exercisesController from "./controllers/exercisesController.ts";

const router = new Router();

router
  .get("/api", (ctx) => {
    ctx.response.status = 200;
    ctx.response.body = {};
  })
  .get("/api/public", exercisesController.list)
  .get("/api/public/:id", exercisesController.get)
  .post("/api/public/:id", exercisesController.check);
// TODO: images in exercises

export default router;
