import { Application, Context, HttpError } from "./deps.ts";
import { User } from "./types/mod.ts";
import router from "./router.ts";

interface State {
  seed: number;
  user: User | null;
}

const app = new Application<State>();

app.addEventListener("error", (e) => {
  console.error(e.error);
});

function die(ctx: Context, status = 500, msg = "") {
  console.log(ctx.request.method, ctx.request.url.pathname, ctx.state, status);
  ctx.response.status = status;
  ctx.response.body = { status, msg };
}

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) die(ctx, e.status, e.message);
    else if (e instanceof Error) {
      die(ctx, 500, e.message);
      console.trace(e.message, e.stack);
    } else {
      die(ctx);
      console.trace("UNDEFINED ERROR:", e.message, e.stack);
    }
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", () => {
  console.log("Server started");
});

const abortController = new AbortController();
const { signal } = abortController;

function countdown(seconds: number): Promise<void> {
  if (seconds) {
    Deno.stdout.writeSync(new Uint8Array([126]));
    return new Promise((r) =>
      setTimeout(() => countdown(seconds - 1).then(r), 1e3)
    );
  }
  Deno.stdout.writeSync(new Uint8Array([10]));
  return new Promise((r) => r());
}

Promise.race([
  // this will not be executed in the development environment
  // see https://github.com/denosaurs/denon/issues/126
  // Deno.signal(Deno.Signal.SIGKILL),
  Deno.signal(Deno.Signal.SIGINT),
  Deno.signal(Deno.Signal.SIGQUIT),
  Deno.signal(Deno.Signal.SIGTERM),
]).then(() => {
  console.log("The server is closing...");
  abortController.abort();
  // TODO: redis.close();
}).then(() => countdown(5)).finally(Deno.exit);

await app.listen({ port: 8000, signal });
console.log("Oak server closed.");
