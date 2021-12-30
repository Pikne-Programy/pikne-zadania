import { assert, chalk } from "../../deps.ts";
import { Type } from "../types/mod.ts";
import { getOrRegisterToken } from "./mod.ts";

export class ModuleRef<V extends Type = Type> {
  #mapping = new Map<V, InstanceType<V>>();
  static token = getOrRegisterToken(this as Type);

  constructor(public readonly layer: string) {}

  setMapping(map: (readonly [V, InstanceType<V>])[]): this;

  setMapping(map: readonly [V, InstanceType<V>]): this;

  setMapping(
    _map: readonly [V, InstanceType<V>] | (readonly [V, InstanceType<V>])[]
  ): this {
    const map = (Array.isArray(_map[0]) ? _map : [_map]) as (readonly [
      V,
      InstanceType<V>
    ])[];

    map.forEach(([clazz, instance]) => this.#mapping.set(clazz, instance));

    return this;
  }

  listInstances() {
    return Array.from(this.#mapping.values());
  }
  entries() {
    return this.listAvailable().map(
      (service) => [getOrRegisterToken(service), service] as const
    );
  }
  listAvailable() {
    return Array.from(this.#mapping.keys());
  }
  listAvailableTokens() {
    return this.listAvailable().map(getOrRegisterToken);
  }

  resolve<M extends V>(clazz: M) {
    const instance = this.#mapping.get(clazz);

    return instance as InstanceType<M> | undefined;
  }

  resolveOrFail<M extends V>(clazz: M) {
    const instance = this.resolve(clazz);

    assert(
      instance,
      chalk.red(
        `There is no registered instance for class: ${chalk.yellow(clazz.name)}`
      )
    );

    return instance;
  }

  previous?: ModuleRef<V>;
}
