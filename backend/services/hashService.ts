import { ConfigService } from "./mod.ts";
import { sha256 } from "../utils/mod.ts";

export class HashService {
  constructor(public config: ConfigService) {}

  hash(login: string) {
    return sha256(login, this.config.USER_SALT);
  }
}
