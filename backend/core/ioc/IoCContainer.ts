import { IocResolver, ModuleRef, ServiceType } from "./mod.ts";
import { assert, chalk } from "../../deps.ts";

export class IoCContainer<
  Container extends Record<string, ServiceType[]>,
  GlobalLayer extends ServiceType = ServiceType,
> {
  #layers = {} as Container;
  #layersOrder: (keyof Container)[] = [];
  #globalLayer: GlobalLayer[] = [];

  globalLayer(elements: GlobalLayer[]) {
    this.#globalLayer = elements;
    return this;
  }

  registerLayer<Layer extends string, Elements extends ServiceType[]>(
    name: Layer,
    elements: Elements,
  ): IoCContainer<Container & { [P in Layer]: Elements }> {
    const nextThis = this as unknown as IoCContainer<
      Container & { [P in Layer]: Elements }
    >;

    this.#layersOrder.push(name);

    assert(
      !nextThis.#layers[name],
      chalk.red(`layer (${name}) already exists!`),
    );

    //@ts-ignore idk why that
    nextThis.#layers[name] = elements;

    return nextThis;
  }

  async resolve() {
    const result = await new IocResolver(this.#globalLayer).resolve({
      order: this.#layersOrder as string[],
      layers: this.#layers,
    });

    return result as
      & {
        [P in keyof Container]: ModuleRef<Container[P][number]>;
      }
      & {
        global: ModuleRef<GlobalLayer>;
      };
  }
}
