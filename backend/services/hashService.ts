import { ConfigService } from "./mod.ts";
import { createHash, pbkdf2Sync, hash, hashSync } from "../deps.ts";

export class HashService {
  secondhash = hash;
  secondhashSync = hashSync;
  constructor(public config: ConfigService) {}

  hash(login: string) {
    return this.sha256(login, this.config.USER_SALT);
  }
  bufferToHex(buffer: ArrayBuffer) {
    // SRC: https://stackoverflow.com/a/50767210/6732111
    return [...new Uint8Array(buffer)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  firsthash(user: string, password: string) {
    // SRC: https://gist.github.com/Nircek/bf06c93f8df36bf645534c10eb6305ca
    return btoa(
      String.fromCharCode(
        ...new Uint8Array(pbkdf2Sync(password, user, 1e6, 256 / 8, "sha512"))
      )
    );
  }
  sha256(data: string, salt = "") {
    return this.bufferToHex(
      createHash("sha256")
        .update(salt + data)
        .digest()
    );
  }
}
