import { vs } from "../deps.ts";
import {
  base64of256bitsRegex,
  comb,
  emailRegex,
  userIdOptions,
  userNameOptions,
  userNumberOptions,
  userSeedOptions,
} from "../common/mod.ts";

export const userSchema = {
  id: vs.string(userIdOptions), // please update subject.assignees below
  idOptional: vs.string({ ...userIdOptions }),
  login: vs.string({ strictType: true, pattern: comb(emailRegex, /|root/) }),
  loginEmail: vs.string({ strictType: true, pattern: emailRegex }),
  name: vs.string(userNameOptions),
  /** `undefined` -> `null` */
  nameOptional: vs.string({ ...userNameOptions, ifUndefined: null }),
  hashedPassword: vs.string({
    strictType: true,
    pattern: base64of256bitsRegex,
  }),
  seed: vs.number(userSeedOptions),
  /** `undefined` -> `null` */
  seedOptional: vs.number({ ...userSeedOptions, ifUndefined: null }),
  /** `undefined` -> `0` */
  seedDefault: vs.number({ ...userSeedOptions, ifUndefined: 0 }),
  /** `null` -> `NaN` */
  number: vs.number(userNumberOptions),
  /** `null` -> `NaN`, `undefined` -> `null` */
  numberOptional: vs.number({ ...userNumberOptions, ifUndefined: null }),
};
