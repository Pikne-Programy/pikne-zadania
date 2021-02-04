export class Tuple<A, B, C> {
  constructor(
    public first: A,
    public second: B,
    public third: C | null = null
  ) {}
}
