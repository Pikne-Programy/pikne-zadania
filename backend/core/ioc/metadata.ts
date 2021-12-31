import { assert, Reflect } from "../../deps.ts";
import { isArrayOf } from "../../utils/mod.ts";
import { Type } from "../types/mod.ts";

export const META_INJECT_KEY = Symbol();

export const getMetadata = (target: unknown) => {
  const metadata = Reflect.getMetadata("design:paramtypes", target);
  const metadataOverride: { position: number; value: unknown }[] =
    Reflect.getMetadata(META_INJECT_KEY, target) || [];

  //override reflection with @Inject() custom values
  if (Array.isArray(metadata)) {
    metadataOverride.forEach(({ position, value }) => {
      metadata[position] = value;
    });
  }

  const functionOrString = (maybeFn: unknown): maybeFn is Type | string =>
    typeof maybeFn === "function" || typeof maybeFn === "string";

  assert(
    isArrayOf(functionOrString, metadata),
    `invalid metadata! expected Function[] | string[], received: ${metadata} on ${
      typeof target === "function" ? target.name : target
    }`,
  );

  return metadata;
};
