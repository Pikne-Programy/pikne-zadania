import { Router } from "./deps.ts";

const router = new Router();

router
.get("/api", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = {};
});

export default router;
