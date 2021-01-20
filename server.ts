import { Application, send } from "./deps.ts";
import router from "./router.ts";

interface State {
  seed: number;
}

const app = new Application<State>();

app.use(router.routes());
app.use(router.allowedMethods());

app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/frontend`,
    index: "index.html",
  });
});

app.addEventListener("listen", () => {
  console.log("Server started");
});

await app.listen({ port: 8000 });
