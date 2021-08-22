import { superoak, test, TestSuite } from "../test_deps.ts";
import { Await } from "../types/mod.ts";
import { sha256 } from "../utils/mod.ts";
import { IConfigService } from "../interfaces/mod.ts";
import { constructApp } from "../app.ts";

const lazyDefaultConfig: IConfigService = {
  MONGO_CONF: {
    db: "pikne-zadania",
    url: "mongodb://mongo:27017",
    time: 5e3,
  },
  SEED_AGE: 60 * 60 * 24 * 31 * 12 * 4,
  LOGIN_TIME: 2e3,
  USER_SALT: "",
  RNG_PREC: 3,
  ANSWER_PREC: .01,
  DECIMAL_POINT: true,
  VERBOSITY: 1,
  JWT_CONF: {
    exp: 7 * 24 * 60 * 60,
    header: { alg: "HS256", typ: "JWT" },
    key: "secret",
  },
  ROOT_CONF: {
    enable: true,
    dhPassword: "$2a$10$zR.KkcwBxhQxbNPL9HMuReq8GyIJoQNilzdFoA1JevLQ0.BgZoo72", // secret
  },
  hash(login: string) {
    return sha256(login, this.USER_SALT);
  },
};

/** AppContext */
interface AC {
  r: Await<ReturnType<typeof constructApp>>;
  request: Await<ReturnType<typeof superoak>>;
}
const appSuite = new TestSuite<AC>({
  name: "app",
  async beforeAll(context: AC) {
    context.r = await constructApp(lazyDefaultConfig);
  },
  async beforeEach(context: AC) {
    context.request = await superoak(context.r.app.handle.bind(context.r.app));
  },
  afterAll(context: AC) {
    context.r.closeDb();
  },
});

test(appSuite, "/ -- placeholder", async (context: AC) => {
  await context.request.get("/api")
    .expect(200)
    .expect("Content-Type", /json/)
    .expect("{}");
});
