import { Exercise } from "../exercise.ts";
class RNG {
  constructor(readonly seed: number) {}
  rand(min: number, max: number, step: number): number {
    // TODO
    return 0;
  }
}
class RPN {
  stack: (string | number)[] = [];
  index = 0;
  push(what: string | number) {
    this.stack.push(what);
  }
  pop(): string | number {
    if (this.index >= this.stack.length) {
      throw RangeError();
    }
    return this.stack[this.index++];
  }
  reset() {
    this.index = 0;
  }
}
class Range {
  constructor(
    readonly min: number,
    readonly max: number,
    readonly step: number,
  ) {}
  rand(r: RNG): number {
    return r.rand(this.min, this.max, this.step);
  }
}
export class EquationExercise extends Exercise {
  readonly parsedContent: string; // "lorem ipsum \(d=300\mathrm{km\}\) foo \(v_a=\mathrm{\frac{m}{s}}\) bar \(v_b=\frac{m}{s}\)."
  readonly ranges: Map<number, string>; // index -> var name
  readonly variables: Map<string, RPN | Range | number>; // var name -> RPN or Range
  readonly unknowns: Map<string, string>; // unknown' name -> unknown' unit
  readonly order: string[]; // order of variables to calculate
  // content -> parse to latex, extract NPM or Range or number -> return parsed text
  constructor(id: string) {
    // TODO
    super(id);
    // get file from disk
    // get properties (name, tags...)
    this.name = "";
    this.properties = new Map<string, string>();
    // parse content
    this.parsedContent =
      "lorem ipsum (d=300mathrm{km}) foo (v_a=mathrm{\frac{m}{s}}) bar (v_b=\frac{m}{s}).";
    this.ranges = new Map<number, string>();
    this.variables = new Map<string, RPN | Range | number>();
    this.unknowns = new Map<string, string>();
    this.order = [];
    // parsed content -> user
    // unknowns -> equation object -> user
  }

  render(uid: string): string {
    // TODO
    // gets all ranges and randomize it
    // pastes all randomized variables into (local)parsedContent
    // returns parsedContent
    return "";
  }
  check(uid: string, answer: string): string {
    // TODO
    let variables : Map<string, number>;
    // get numbers
    // randomize ranges (in order defined in this.ranges)
    // calculate RNPs (in order defined in this.order)
    // return unknowns
    return "";
  }
}
