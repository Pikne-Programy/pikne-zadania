import Exercise from "../exercise.ts";
import { JSONType, YAMLType } from "../types.ts";
import { MersenneTwister19937, Random } from "../deps.ts";
class RNG {
  readonly rng: Random;
  static precision(a: number) {
    // SRC: https://stackoverflow.com/a/27865285/6732111
    if (!isFinite(a)) return 0;
    let e = 1, p = 0;
    while (Math.round(a * e) / e !== a) {
      e *= 10;
      p++;
    }
    return p;
  }
  constructor(readonly seed: number) {
    this.rng = new Random(MersenneTwister19937.seed(seed));
  }
  rand(min: number, max: number, step?: number): number {
    let guess = this.rng.real(min, max, true);
    if (step) { // it's not usable if it's 0
      return +(min + Math.round((guess - min) / step) * step).toFixed(
        RNG.precision(step),
      );
    } else {
      return +guess.toPrecision(3);
    }
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
    return {
      "type": "EqEx",
      "name": "Pociągi dwa 2",
      "content": {
        "main":
          "Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?",
        "imgs": ["1.png", "2.png"],
        "unknowns": [
          ["\\(x\\)", "\\(\\mathrm{km}\\)"],
          ["\\(t\\)", "\\(\\mathrm{s}\\)"],
        ],
      },
    };
  }
  check(uid: string, answer: JSONType): JSONType {
    // TODO
    let variables: { [key: string]: number };
    // get numbers
    // randomize ranges (in order defined in this.ranges)
    // calculate RPNs (in order defined in this.order)
    // return unknowns
    return {
      success: false,
    };
  }
}
