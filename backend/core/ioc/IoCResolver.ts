import { onInit, Type } from "../types/mod.ts";
import { assert, chalk } from "../../deps.ts";
import { getMetadata, getOrRegisterToken, Graph, ModuleRef } from "./mod.ts";
import { reThrow } from "../../utils/mod.ts";

//deno-lint-ignore ban-types no-explicit-any
export type ServiceType = Type<onInit | {}, any[]>;

interface LayerData {
  name: string;
  services: ServiceType[];
}

//FIXME typings
export class IocResolver {
  #globalRef?: ModuleRef;

  constructor(private globalLayer: ServiceType[] = []) {}

  async resolve({
    order,
    layers,
  }: {
    order: string[];
    layers: Record<string, ServiceType[]>;
  }) {
    const result = {} as Record<string, ModuleRef>;
    let previousRef: ModuleRef | undefined;

    result["global"] = await this.globalModuleRef();

    for (const name of order) {
      const ref = await this.layer2ModuleRef(
        {
          name,
          services: layers[name],
        },
        previousRef,
      );

      previousRef = result[name] = ref;
    }

    return result;
  }

  async globalModuleRef() {
    this.#globalRef = await this.layer2ModuleRef({
      name: "global",
      services: this.globalLayer,
    });

    return this.#globalRef;
  }

  layer2ModuleRef({ services, name }: LayerData, previousRef?: ModuleRef) {
    console.log(
      chalk.green("-------------------- "),
      chalk.yellow(name),
      chalk.green("-------------------- "),
    );

    const getToken = (dep: ServiceType | string) =>
      typeof dep === "function" ? getOrRegisterToken(dep) : dep;

    const requestedDependencies = services
      .map(getMetadata)
      .flatMap((meta) => meta.map(getToken));
    const availableDependencies = new Set(
      [
        ModuleRef.token,
        requestedDependencies,
        previousRef?.listAvailableTokens() || [],
      ].flat(),
    );

    this.validate(requestedDependencies, availableDependencies);

    const serviceWithMeta = (service: Type) =>
      [getOrRegisterToken(service), service] as const;

    const graphInput = services.map(serviceWithMeta);

    const graph = new Graph<string, Type>(
      graphInput
        .concat((this.#globalRef?.listAvailable() || []).map(serviceWithMeta))
        .concat(previousRef?.entries() || []),
      graphInput.flatMap(([token, service]) =>
        getMetadata(service)
          .map(getToken)
          .map((to) => [token, to] as const)
      ),
    );

    const prev = new Set(
      [
        previousRef?.listAvailable() || [],
        this.#globalRef?.listAvailable() || [],
      ].flat(),
    );
    const sorted = reThrow(
      () => graph.sort().filter(([service]) => !prev.has(service)),
      new Error(
        chalk.red(`circular dependency in ${chalk.yellow(`(${name})`)} layer`),
      ),
    );

    return this.initiate(this.resolveLayer(sorted, name, previousRef));
  }

  private resolveLayer(
    services: [ServiceType, ServiceType[]][],
    name: string,
    previousRef?: ModuleRef,
  ) {
    const moduleRef = new ModuleRef(name);

    for (const [service, requested] of services) {
      const args = requested.map(
        (req: ServiceType) =>
          this.#globalRef?.resolve(req) ||
          previousRef?.resolve(req) ||
          moduleRef.resolveOrFail(req),
      );

      const instance = new service(...args);

      console.log(
        `${
          chalk.green(
            `[${service.name}]`,
          )
        } instanciated on layer ${chalk.yellow(`(${name})`)}`,
      );

      moduleRef.setMapping([service, instance]);
    }

    moduleRef.previous = previousRef;

    return moduleRef;
  }

  private validate(
    requested: string[],
    available: Set<string>,
    failureMessage?: string,
  ) {
    assert(requested.every(available.has, available), failureMessage);
    return available;
  }

  private isInitiable(instance: onInit): instance is Required<onInit> {
    return typeof instance?.init === "function";
  }
  private async initiate(moduleRef: ModuleRef) {
    await Promise.all(
      moduleRef
        .listInstances()
        .filter(this.isInitiable)
        .map(async (instance: Required<onInit>) => {
          await instance.init();
          console.log(
            `${
              chalk.green(
                `[${instance.constructor.name}]`,
              )
            } initialized on layer ${chalk.yellow(`(${moduleRef.layer})`)}`,
          );
        }),
    );

    return moduleRef;
  }
}
