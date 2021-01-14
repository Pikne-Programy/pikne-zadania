import Exercise from "../exercise.ts";
import { JSONType, YAMLType } from "../types.ts";
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
  private empty(): boolean {
    return this.index >= this.stack.length;
  }
  private pop(): string | number {
    if (this.empty()) {
      throw RangeError();
    }
    return this.stack[this.index++];
  }
  private reset() {
    this.index = 0;
  }
  calculate(variables: Map<string, number>): number {
    // TODO
    let result = 0;
    while (!this.empty()) {
      let _: number | string = this.pop();
      // change string to number from variables
      // calculate
    }
    this.reset();
    return result;
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
export default class EquationExercise extends Exercise {
  type = "EqEx";
  readonly parsedContent: string; // "lorem ipsum \(d=300\mathrm{km\}\) foo \(v_a=\mathrm{\frac{m}{s}}\) bar \(v_b=\frac{m}{s}\)."
  readonly ranges: { [key: number]: string }; // index -> var name
  readonly variables: { [key: string]: RPN | Range | number }; // var name -> RPN or Range
  readonly unknowns: { [key: string]: string }; // unknown' name -> unknown' unit
  readonly order: string[]; // order of variables to calculate
  // content -> parse to latex, extract NPM or Range or number -> return parsed text
  constructor(
    readonly name: string,
    content: string,
    readonly properties: { [key: string]: YAMLType },
  ) {
    super(name, content, properties); // TODO
    // parse content
    this.parsedContent =
      "lorem ipsum (d=300mathrm{km}) foo (v_a=mathrm{\frac{m}{s}}) bar (v_b=\frac{m}{s}).";
    this.ranges = {};
    this.variables = {};
    this.unknowns = {};
    this.order = [];
    // parsed content -> user
    // unknowns -> equation object -> user
  }

  render(uid: string): JSONType {
    // TODO
    // gets all ranges and randomize it
    // pastes all randomized variables into (local)parsedContent
    // returns parsedContent
    return "";
  }
  check(uid: string, answer: JSONType): JSONType {
    // TODO
    let variables: { [key: string]: number };
    // get numbers
    // randomize ranges (in order defined in this.ranges)
    // calculate RPNs (in order defined in this.order)
    // return unknowns
    return "";
  }
}
