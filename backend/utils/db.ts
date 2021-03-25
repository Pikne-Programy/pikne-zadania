import { Bson as Bison, MongoClient } from "../deps.ts";
import { WorkingDatabase } from "./db/working.ts";
import { Database } from "./db/placeholder.ts";

// console.log(Bison); // Tue, 23 Mar 2021 01:17:24 +0100

const client = new MongoClient();
let db: Database;
try {
  await client.connect("mongodb://mongo:27017");
  db = new WorkingDatabase(client);
} catch (e) {
  console.error("MONGO:", e.message, e.stack);
  db = new Database();
}
export { db };
