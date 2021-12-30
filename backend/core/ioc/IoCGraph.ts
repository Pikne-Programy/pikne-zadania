import { TopologicalSort } from "../../deps.ts";

export class Graph<K, T> {
  #graph: TopologicalSort<K, T>;

  constructor(input: (readonly [K, T])[], edges: (readonly [K, K])[]) {
    this.#graph = new TopologicalSort(new Map<K, T>(input));

    edges.forEach(([from, to]) => this.#graph.addEdge(from, to));
  }

  sort() {
    const sorted = Array.from(this.#graph.sort().values())
      .map(({ node, children }) => [
        node,
        Array.from(children.values()).map(({ node }) => node),
      ])
      .reverse();

    return sorted as [T, T[]][];
  }
}
