import Exercise from "../exercise.ts";
import { JSONType, YAMLType } from "../types.ts";
import { MersenneTwister19937, Random } from "../deps.ts";

enum Expressions {
  Number, // 0
  Variable, // 1
  Operation, // 2
  Function, // 3
  Bracket, // 4
  Whitespace, // 5
}

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
    const guess = this.rng.real(min, max, true);
    if (step) {
      // it's not usable if it's 0
      return +(min + Math.round((guess - min) / step) * step).toFixed(
        RNG.precision(step),
      );
    } else {
      return +guess.toPrecision(3);
    }
  }
}

class RPN {
  readonly ONPeq: (string | number)[] = []; // Array containing the equation in RPN format
  static readonly operations: { [key: string]: number } = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
    "^": 3,
  };
  static readonly functionsDict: { [key: string]: (x: number) => number } = {
    exp: Math.exp,
    abs: Math.abs,
    ln: Math.log,
    log2: Math.log2,
    log: Math.log10,
    sin: Math.sin,
    sinh: Math.sinh,
    cos: Math.cos,
    cosh: Math.cosh,
    tg: Math.tan,
    tgh: Math.tanh,
    ctg: (v: number) => Math.cos(v) / Math.sin(v),
    ctgh: (v: number) => Math.cosh(v) / Math.sinh(v),
  };

  push(what: string | number) {
    this.ONPeq.push(what);
  }
  // returns the priority of an operator
  // example: "+" -> 1 and "^" -> 3
  static getPriority(operator: string): number {
    if (operator in RPN.operations) return RPN.operations[operator];
    else return 0;
  }
  // return the type of an expression
  // example: 1234 -> Expressions.Number, v_a -> Expressions.Variable, sin -> Expressions.Operation
  static getType(exp: string | number): Expressions {
    if (typeof exp === "number" || RegExp(EquationExercise.numberR).test(exp)) {
      return Expressions.Number;
    } else if (RegExp(EquationExercise.functionsR).test(exp)) {
      return Expressions.Function;
    } else if (RegExp(EquationExercise.variableR).test(exp)) {
      return Expressions.Variable;
    } else if (RegExp(EquationExercise.operationsR).test(exp)) {
      return Expressions.Operation;
    } else if (exp === "(" || exp === ")") return Expressions.Bracket;
    else return Expressions.Whitespace;
  }
  // calculates this.RPNeq and returns the value
  // RPN { ONPeq: ["10", "0", "6", "-",  "4", "2", "^",  "+", "(", "*"] } -> 100
  calculate(variables: { [key: string]: number }): number {
    const stack: number[] = [];
    this.ONPeq.forEach((exp) => {
      const type = RPN.getType(exp);
      if (typeof exp === "number") {
        stack.push(exp);
      } else if (type === Expressions.Number) {
        stack.push(parseFloat(exp));
      } else if (type === Expressions.Variable) {
        if (exp in variables) {
          stack.push(variables[exp]);
        }
      } else if (type === Expressions.Operation) {
        if (stack.length < 2) {
          throw new Error(
            "INVALID EQUATION, REMOVING OPERATION FROM EMPTY STACK",
          );
        }
        const v2 = stack.pop()!;
        let v1 = stack.pop()!;
        if (exp === "+") {
          v1 += v2;
        } else if (exp === "-") {
          v1 -= v2;
        } else if (exp === "*") {
          v1 *= v2;
        } else if (exp === "/") {
          v1 /= v2;
        } else if (exp === "^") {
          v1 = Math.pow(v1, v2);
        }
        stack.push(v1);
      } else if (type === Expressions.Function) {
        if (stack.length < 1) {
          throw new Error(
            "INVALID EQUATION, REMOVING FUNCTION FROM EMPTY STACK",
          );
        }
        if (exp in RPN.functionsDict) {
          throw new Error("UNKNOWN FUNCTION");
        }
        let v = stack.pop()!;
        v = exp[exp.length - 1] === "r" ? v : (v * Math.PI) / 180;
        v = RPN.functionsDict[exp](v);
      }
    });
    return stack[0];
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
  // regexes used to match specific expressions
  static readonly numberR = "[0-9]*\\.?[0-9]+(?:[eE][\\-\\+]?[0-9]+)?";
  static readonly variableR = "(?<![0-9])[a-zA-Z_][a-zA-Z_0-9]*";
  static readonly unitR = "(?:[a-zA-Z_0-9\\/\\*\\^\\(\\)]+)?";
  static readonly functionsR = "(?:sin|cos|tan)h?r?|abs|exp|ln|log2|log10";
  static readonly operationsR = "[\\+\\-*\\/\\^\\-]";
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

  render(seed: number): JSONType {
    // TODO
    // gets all ranges and randomize it
    // pastes all randomized variables into (local)parsedContent
    // returns parsedContent
    return {
      type: "EqEx",
      name: "Pociągi dwa 2",
      content: {
        main:
          "Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?",
        //imgs: ["1.png", "2.png"],
        unknowns: [
          ["x", "\\mathrm{km}"],
          ["t", "\\mathrm{s}"],
        ],
      },
    };
  }
  check(seed: number, answer: JSONType): JSONType {
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
  // Split equation string to an array of touples [expression:string, type:Expressions]
  // enum Expressions
  // Number = 0
  // Variable = 1
  // Operation = 2
  // Function = 3
  // Bracket = 4
  // Whitespace = 5
  // example: "10*(-6+4^2)" -> [[ "10", 0 ], [ "*", 2 ], [ "(", 4 ],  [ "-", 2 ], [ "6", 0 ],  [ "+", 2 ], [ "4", 0 ],  [ "^", 2 ], [ "2", 0 ]]
  static extractEquation(eq: string): [string, Expressions][] {
    const tab: [string, Expressions][] = [];
    const r = new RegExp(
      `(?:${this.operationsR})|[\(\)]|(?:${this.functionsR})|(?:${this.numberR})|(?:${this.variableR})`,
      "g",
    );
    let arr: RegExpExecArray | null;
    while ((arr = r.exec(eq)) !== null) {
      const a: [string, Expressions] = [arr[0], RPN.getType(arr[0])];
      tab.push(a);
    }

    return tab;
  }
  // convert equation to an RPN object
  // example: "10*(-6+4^2)" -> RPN { ONPeq: ["10", "0", "6", "-",  "4", "2", "^",  "+", "(", "*"] }
  static convertToRPN(eq: string): RPN {
    const stack: string[] = []; // stack for operations/brackets/functions
    const nestedFunctions: { [key: number]: string } = {}; // stack of nested functions; ex: sin(2*(1+cos(x)) -> {0:"sin", 2:"cos"}
    let level = 0; // nesting level
    let beginning = true; // true if previous expression wasn't a number or variable; used for converting (-x) -> 0-x
    const RPNeq = new RPN();
    const expEq = EquationExercise.extractEquation(eq);
    expEq.forEach(function (exp: [string, Expressions]) {
      if (exp[1] === Expressions.Whitespace) return;
      else if (exp[1] === Expressions.Bracket) {
        if (exp[0] === "(") {
          stack.push("(");
          beginning = true;
          level++;
        } else if (exp[0] === ")") {
          while (stack.length > 0 && stack[stack.length - 1] !== "(") {
            RPNeq.push(stack.pop()!);
            if (stack.length === 0) {
              throw new Error("MISSING BEGINNING OF A BRACKET");
            }
          }
          stack.pop();
          beginning = false;
          level--;
          if (level < 0) {
            throw new Error("MISSING BEGINNING OF A BRACKET");
          }
        }
      } else if (exp[1] === Expressions.Operation) {
        if (beginning) {
          if (exp[0] === "-") {
            RPNeq.push("0");
            nestedFunctions[level] = "-";
          } else if (exp[0] !== "+") {
            throw new Error("OPERATION IN UNEXPECTED POSITION");
          }
        } else {
          const p1 = RPN.getPriority(exp[0]);
          while (stack.length > 0) {
            const p2 = RPN.getPriority(stack[stack.length - 1]);
            if (p1 >= p2) break;
            RPNeq.push(stack.pop()!);
          }
          stack.push(exp[0]);
          beginning = true;
        }
      } else if (exp[1] === Expressions.Function) {
        nestedFunctions[level] = exp[0];
      } else {
        RPNeq.push(exp[0]);
        beginning = false;
      }
      if (
        exp[1] === Expressions.Number ||
        exp[1] === Expressions.Variable ||
        exp[0] === ")"
      ) {
        if (level in nestedFunctions) {
          RPNeq.push(nestedFunctions[level]);
          delete nestedFunctions[level];
        }
      }
    });
    while (stack.length > 0) {
      RPNeq.push(stack.pop()!);
    }
    return RPNeq;
  }
}
