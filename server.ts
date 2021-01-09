import { Application, send } from "./deps.ts";

const app = new Application();

app.use(async (context) => {
  await send(context, context.request.url.pathname, {
    root: `${Deno.cwd()}/frontend`,
    index: "index.html",
  });
});

app.addEventListener('listen', () => {
  console.log("Server started");
})

await app.listen({ port: 8000 });
