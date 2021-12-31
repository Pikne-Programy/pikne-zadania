import { assert } from "../../deps.ts";
import { Type } from "../types/mod.ts";

const tokens = new Map<unknown, string>();

export const registerToken = (target: Type, token?: string) => {
  assert(!tokens.has(target), `target (${target.name}) already registered!`);
  assert(
    !Object.values(tokens).includes(token),
    `token (${token}) already registered!`,
  );

  const hash = token || crypto.randomUUID();

  tokens.set(target, hash);

  return hash;
};

export const getOrRegisterToken = (target: Type) => {
  if (!tokens.has(target)) {
    registerToken(target);
  }

  return tokens.get(target)!;
};
