import Exercise from "../exercise.ts";
import { JSONType, YAMLType } from "../types.ts";
import { MersenneTwister19937, Random } from "../deps.ts";

enum Expressions {
  Whitespace, // 0
  Number, // 1
  Variable, // 2
  Operation, // 3
  Bracket, // 4
  Function, // 5
  Trygonometry, // 6
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
  readonly RPNeq: (string | number)[] = []; // Array containing the equation in RPN format
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
    asin: Math.asin,
    asinh: Math.asinh,
    cos: Math.cos,
    cosh: Math.cosh,
    acos: Math.acos,
    acosh: Math.acosh,
    tg: Math.tan,
    tgh: Math.tanh,
    atg: Math.atan,
    atgh: Math.atanh,
    ctg: (v: number) => Math.cos(v) / Math.sin(v),
    ctgh: (v: number) => Math.cosh(v) / Math.sinh(v),
    actg: (v: number) => Math.PI / 2 - Math.atan(v),
    actgh: (v: number) => Math.log(Math.sqrt((v + 1) / (v - 1))),
  };

  push(what: string | number) {
    this.RPNeq.push(what);
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
    } else if (RegExp(EquationExercise.functionR).test(exp)) {
      return Expressions.Function;
    } else if (RegExp(EquationExercise.trygonometryR).test(exp)) {
      return Expressions.Trygonometry;
    } else if (RegExp(EquationExercise.variableR).test(exp)) {
      return Expressions.Variable;
    } else if (RegExp(EquationExercise.operationR).test(exp)) {
      return Expressions.Operation;
    } else if (exp === "(" || exp === ")") return Expressions.Bracket;
    else return Expressions.Whitespace;
  }
  // calculates this.RPNeq and returns the value
  // RPN { ONPeq: ["10", "0", "6", "-",  "4", "2", "^",  "+", "(", "*"] } -> 100
  calculate(variables: { [key: string]: number }): number {
    const stack: number[] = [];
    this.RPNeq.forEach((exp) => {
      const type = RPN.getType(exp);
      let v: number | null = null;
      if (typeof exp === "number") {
        v = exp;
      } else if (type === Expressions.Number) {
        v = parseFloat(exp);
      } else if (type === Expressions.Variable) {
        if (exp in variables) {
          v = variables[exp];
        }
      } else if (type === Expressions.Operation) {
        if (stack.length < 2) {
          throw new Error(
            "INVALID EQUATION, REMOVING OPERATION FROM EMPTY STACK",
          );
        }
        const v2 = stack.pop()!;
        v = stack.pop()!;
        if (exp === "+") {
          v += v2;
        } else if (exp === "-") {
          v -= v2;
        } else if (exp === "*") {
          v *= v2;
        } else if (exp === "/") {
          v /= v2;
        } else if (exp === "^") {
          v = Math.pow(v, v2);
        }
      } else if (type === Expressions.Function) {
        if (stack.length < 1) {
          throw new Error(
            "INVALID EQUATION, REMOVING FUNCTION FROM EMPTY STACK",
          );
        }
        v = stack.pop()!;
        v = RPN.functionsDict[exp](v);
      } else if (type === Expressions.Trygonometry) {
        if (stack.length < 1) {
          throw new Error(
            "INVALID EQUATION, REMOVING FUNCTION FROM EMPTY STACK",
          );
        }
        v = stack.pop()!;
        if (exp[0] !== "a" && exp[exp.length - 1] !== "r") {
          // convert degrees to radians
          v = (v * Math.PI) / 180;
        }
        v = RPN.functionsDict[
          exp[exp.length - 1] === "r" ? exp.slice(0, -1) : exp
        ](v);
        if (exp[0] === "a" && exp[exp.length - 1] !== "r") {
          // convert radians to degrees
          v = (v * 180) / Math.PI;
        }
      }
      if (v === null || isNaN(v) || !isFinite(v)) {
        throw new Error("INVALID EQUATION, UNEXPECTED VALUE WHILE CALCULATING");
      }
      stack.push(v);
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
  static readonly unitR = "(?:[a-zA-Z0-9\\+\\-\\/\\*\\^]+)?";
  static readonly operationR = "[\\+\\-*\\/\\^\\-]";
  static readonly functionR = "abs|exp|ln|log2|log10";
  static readonly trygonometryR = "a?(?:sin|cos|tan)h?r?";
  // regexes used to extract and parse content
  static readonly equationR = new RegExp(
    `(${EquationExercise.variableR})=((?:(?:[\\+\\-]?(?:${EquationExercise.trygonometryR}|${EquationExercise.functionR})?[\\^a-zA-Z_0-9.\\(\\)]+${EquationExercise.operationR}*)+))`,
  );
  static readonly numberEqR = new RegExp(
    `(${EquationExercise.variableR})=(${EquationExercise.numberR})(${EquationExercise.unitR})`,
  );
  static readonly unknownEqR = new RegExp(
    `(${EquationExercise.variableR})=\\?(${EquationExercise.unitR})`,
  );
  static readonly rangeEqR = new RegExp(
    `(${EquationExercise.variableR})=\\[(${EquationExercise.numberR});(${EquationExercise.numberR})(?:;(${EquationExercise.numberR}))?\\](${EquationExercise.unitR})`,
  );
  type = "EqEx";
  readonly parsedContent: string; // "lorem ipsum \(d=300\mathrm{km\}\) foo \(v_a=\mathrm{\frac{m}{s}}\) bar \(v_b=\frac{m}{s}\)."
  readonly ranges: [number, string][] = []; // index -> var name
  readonly variables: { [key: string]: RPN | Range | number } = {}; // var name -> RPN or Range
  readonly unknowns: [string, string][] = []; // unknown' name - unknown' unit
  readonly order: string[] = []; // order of variables to calculate
  readonly answerPrecision: number = 0.02; // such number x that: ans*(100-x)% <= user ans <= ans*(100-x)% returns correct answer

  // content -> parse to latex, extract RPN, Range and number -> return parsed text
  constructor(
    readonly name: string,
    content: string,
    readonly properties: { [key: string]: YAMLType },
  ) {
    super(name, content, properties);
    let segment = 0; // segment 0: problem's content; segment 1: system of equations
    let index = 0; // global index (different than the index of the current line)
    let parsingContent = ""; // content without ranges ([number;number]) and unknowns (=?unit)
    let parsedLine = ""; // line without ranges ([number;number]) and unknowns (=?unit)
    content.split("\n").forEach((line: string) => {
      if (line == "") return;
      else if (line == "---") {
        segment++;
        return;
      } else if (segment == 0) {
        let eqR: RegExp;
        let m: RegExpExecArray | null;
        // --------------------------------------------------
        // considered regex: numberR (variable)=(value)(unit)
        parsedLine = "";
        while ((m = EquationExercise.numberEqR.exec(line)) !== null) {
          const numberMatch = {
            name: m[1],
            index: [
              // {0} d= 300 km {1}
              m.index,
              m.index + m[0].length,
            ],
            value: parseFloat(m[2]),
            unit: EquationExercise.convertToLaTeX(m[3]),
          };
          parsedLine += line.substring(0, numberMatch.index[0]) + "\\(" +
            numberMatch.name + "= " + numberMatch.value + numberMatch.unit +
            "\\)"; // add space next to the '=' to prevent from matching multiple times
          line = line.substring(numberMatch.index[1]); // remove this match from line
          this.variables[numberMatch.name] = numberMatch.value;
        }
        parsedLine += line;
        // --------------------------------------------------
        // considered regex: unknownEqR (variable)=?(unit)
        line = parsedLine;
        parsedLine = "";
        while ((m = EquationExercise.unknownEqR.exec(line)) !== null) {
          const unknownMatch = {
            index: [
              // {0} x {1} =? {2}
              m.index,
              m.index + m[0].length,
            ],
            name: m[1],
            unit: EquationExercise.convertToLaTeX(m[2]),
          };
          parsedLine += line.substring(0, unknownMatch.index[0]) + "\\(" +
            unknownMatch.name + "\\)";
          line = line.substring(unknownMatch.index[1]); // remove this match
          this.unknowns.push([unknownMatch.name, unknownMatch.unit]);
        }
        parsedLine += line;
        // --------------------------------------------------
        // considered regex: rangeEqR (variable)=[(min);(max);(step=1)](unit)
        line = parsedLine;
        parsedLine = "";
        while ((m = EquationExercise.rangeEqR.exec(line)) !== null) {
          const rangeMatch = {
            name: m[1],
            index: [
              // {0} v_a= {1} [40;80;20] m/s {2}
              m.index,
              m.index + m[1].length + 1,
              m.index + m[0].length,
            ],
            rangeMin: parseFloat(m[2]),
            rangeMax: parseFloat(m[3]),
            step: parseFloat(m[4] ?? "1"),
            unit: EquationExercise.convertToLaTeX(m[5]),
          };
          this.variables[rangeMatch.name] = new Range(
            rangeMatch.rangeMin,
            rangeMatch.rangeMax,
            rangeMatch.step,
          );          
          parsedLine += line.substring(0, rangeMatch.index[0]) + "\\(" +
            rangeMatch.name + "=" + rangeMatch.unit + "\\)";
          line = line.substring(rangeMatch.index[2]); // remove this match
          index += 2 + rangeMatch.index[1]; // "\(" + name + "="
          this.ranges.push([index, rangeMatch.name]);
          index += rangeMatch.unit.length + 2; // LaTeX unit + "\)"
        }
        parsedLine += line;
        parsingContent += parsedLine + "\n";
        index += line.length + 1; // what's left + '\n'
      } else if (segment == 1) {
        if (!EquationExercise.equationR.test(line)) {
          throw new Error("LINE DOESNT MATCH PATTERN");
        }
        const m = line.match(EquationExercise.equationR);
        const name = m![1];
        const RPNeq = EquationExercise.convertToRPN(m![2]);
        this.variables[name] = RPNeq;
        this.order.push(name);
      }
    });
    this.parsedContent = parsingContent;
  }

  render(seed: number): {
    type: string;
    name: string;
    content: {
      main: string;
      unknowns: [string, string][];
    };
  } {
    const rng = new RNG(seed);
    let parsingContent = this.parsedContent;
    for (let i = this.ranges.length - 1; i >= 0; --i) {
      const name = this.ranges[i][1];
      const index = this.ranges[i][0];
      const value = (this.variables[name] as Range).rand(rng);
      parsingContent = parsingContent.substr(0, index) +
        value +
        parsingContent.substr(index);
    }
    return {
      type: this.type,
      name: this.name,
      content: {
        main: parsingContent,
        unknowns: this.unknowns,
      },
    };
  }
  check(seed: number, answer: JSONType): {
    success: boolean;
  } {
    const rng = new RNG(seed);
    const calculated: { [key: string]: number } = {};
    // add already calculated numbers to variables
    for (const key in this.variables) {
      if (typeof this.variables[key] == "number") {
        calculated[key] = this.variables[key] as number;
      }
    }
    // randomise ranges (in the correct order) and add them to variable
    for (let i = this.ranges.length - 1; i >= 0; --i) {
      const name = this.ranges[i][1];
      const value = (this.variables[name] as Range).rand(rng);
      calculated[name] = value;
    }
    // calculate RPN variables (in the correct order) and add them to vaiables
    for (let i = 0; i < this.order.length; ++i) {
      const name = this.order[i];
      if (this.variables[name] instanceof RPN) {
        calculated[name] = (this.variables[name] as RPN).calculate(calculated);
      }
    }
    // check if answer is of a good type
    const userAnswer = answer as {
      [key: string]: number;
    };
    if (answer === null) {
      throw new Error("ANSWER IS NOT A DICTIONARY");
    }
    // go through each unknown and compare the answers to what's calculated
    for (const [name, _] of this.unknowns) {
      const correctAns = calculated[name];
      if (name in userAnswer) {
        const ans = userAnswer[name]!;
        if (
          ans < (1 - this.answerPrecision) * correctAns ||
          ans > (1 + this.answerPrecision) * correctAns
        ) {
          return { success: false };
        }
      } else return { success: false };
    }
    return { success: true };
  }
  // Split equation string to an array of touples [expression:string, type:Expressions]
  // enum Expressions
  //   Whitespace 0
  //   Number 1
  //   Variable 2
  //   Operation 3
  //   Bracket 4
  //   Function 5
  //   Trygonometry 6
  // example: "10*(-6+4^2)" -> [[ "10", 0 ], [ "*", 2 ], [ "(", 4 ],  [ "-", 2 ], [ "6", 0 ],  [ "+", 2 ], [ "4", 0 ],  [ "^", 2 ], [ "2", 0 ]]
  static extractEquation(eq: string): [string, Expressions][] {
    const tab: [string, Expressions][] = [];
    const r = new RegExp(
      `(?:${this.operationR})|[\\(\\)]|(?:${this.trygonometryR})|(?:${this.functionR})|(?:${this.numberR})|(?:${this.variableR})`,
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
      } else if (
        exp[1] === Expressions.Function || exp[1] === Expressions.Trygonometry
      ) {
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
  static convertToLaTeX(unit: string): string {
    let parsedUnit = "";
    let isFraction = false;
    const r = "\\^([\\-\\+]?[0-9]+)|([a-zA-Z]+|[\\-\\+])|[\\*\\/\\^]";
    const execR = new RegExp(r, "g");
    const testR = new RegExp(`^(${r})+$`);
    if (!testR.test(unit)) {
      throw new Error("INVALID UNIT FORMAT");
    }
    let m: RegExpExecArray | null;
    while ((m = execR.exec(unit)) !== null) {
      if (m[2] !== undefined) {
        parsedUnit += m[0];
      } else if (m[1] !== undefined) {
        parsedUnit += "^{" + m[1] + "}";
      } else if (m[0] === "*") {
        parsedUnit += "\\cdot ";
      } else if (m[0] === "/") {
        parsedUnit = parsedUnit + "}{";
        isFraction = true;
      }
    }
    parsedUnit = "\\mathrm{" + ((isFraction) ? "\\frac{" : "") + parsedUnit +
      ((isFraction) ? "}" : "") + "}";
    return parsedUnit;
  }
}
