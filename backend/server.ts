import { Application, HttpError, Status } from "./deps.ts";
import router from "./router.ts";

interface State {
  seed: number;
}

const app = new Application<State>();

app.addEventListener("error", (e) => {
  console.log(e.error);
});

const basicHTMLTemplate = (msg: string) =>
  `<!DOCTYPE html><html><body><h1>${msg}</h1></body></html>`;

app.use(async (context, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) {
      context.response.status = e.status;
      context.response.body = basicHTMLTemplate(
        `${e.status} ${e.expose ? e.message : Status[e.status]}`,
      );
    } else if (e instanceof Error) {
      context.response.status = 500;
      context.response.body = basicHTMLTemplate("500 Internal Server Error");
      console.trace(e.message, e.stack);
    } else {
      context.response.status = 500;
      console.trace("UNDEFINED ERROR:", e);
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
