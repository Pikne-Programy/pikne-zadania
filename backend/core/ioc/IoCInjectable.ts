import { Reflect } from "../../deps.ts";
import { META_INJECT_KEY } from "./mod.ts";

export const Injectable = () => (_: unknown) => {}; // Force Reflection Api to describe dependencies
export const Inject = (token: string) =>
  (target: unknown, _: unknown, position: number) => {
    const value = {
      position,
      value: token,
    };
    const previousMeta = Reflect.getMetadata(META_INJECT_KEY, target) || [];
    previousMeta.push(value);

    Reflect.defineMetadata(META_INJECT_KEY, previousMeta, target);
  };
