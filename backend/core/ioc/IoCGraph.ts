import { KahnGraph } from "../../deps.ts";

export class Graph<K extends string, T> {
  #graph = new KahnGraph<{ id: K }>();
  #key2value: Record<K, T>;
  #edges = {} as Record<K, K[]>;

  constructor(input: (readonly [K, T])[], edges: (readonly [K, K])[]) {
    this.#key2value = Object.fromEntries(input) as Record<K, T>;

    const key2id = {} as Record<K, { id: K }>;

    const idObject = (id: K) => {
      if (!key2id[id]) {
        key2id[id] = { id };
      }
      return key2id[id];
    };

    edges.forEach(([from, to]) => {
      const fromObject = idObject(from);
      const toObject = idObject(to);

      this.#graph.addEdge(fromObject, toObject);

      this.#edges[from] ||= [];
      this.#edges[from].push(to);
    });
  }

  sort() {
    const sorted = this.#graph
      .sort()
      .map(({ id }) => [
        this.#key2value[id],
        this.#edges[id]?.map((key) => this.#key2value[key]) || [],
      ])
      .reverse();

    return sorted as [T, T[]][];
  }
}
