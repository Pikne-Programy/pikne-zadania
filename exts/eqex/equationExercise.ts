import Exercise from "../../exercise.ts";
import { JSONType, YAMLType } from "../../types.ts";
import { MersenneTwister19937, Random } from "../../deps.ts";
import RPN from "./RPN-parser/parser.ts";

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

class Range {
  constructor(
    readonly min: number,
    readonly max: number,
    readonly step?: number,
  ) {}
  rand(r: RNG): number {
    return r.rand(this.min, this.max, this.step);
  }
}

export default class EquationExercise extends Exercise {
  // regular expressions used to extract and parse content
  static readonly greekR =
    /alfa|beta|gamma|delta|epsilon|mi|pi|ro|sigma|tau|fi|psi|omega/;
  static readonly equationR = new RegExp(
    `${RPN.variableR}=((?:(?:[\\+\\-]?(?:${RPN.trigonometryR}|${RPN.functionR})?[\\^a-zA-Z_0-9.\\(\\)]+${RPN.operationR}*)+))`,
  );
  static readonly numberEqR = new RegExp(
    `${RPN.variableR}=(${RPN.numberR})(${RPN.unitR})`,
  );
  static readonly unknownEqR = new RegExp(
    `${RPN.variableR}=\\?(${RPN.unitR})`,
  );
  static readonly rangeEqR = new RegExp(
    `${RPN.variableR}=\\[(${RPN.numberR});(${RPN.numberR})(?:;(${RPN.numberR}))?\\](${RPN.unitR})`,
  );
  static readonly greekAlphabet: { [key: string]: string } = {
    alfa: "\\alpha",
    beta: "\\beta",
    gamma: "\\gamma",
    delta: "\\delta",
    Delta: "\\Delta",
    epsilon: "\\epsilon",
    eta: "\\eta",
    mi: "\\mu",
    pi: "\\pi",
    Pi: "\\Pi",
    ro: "\\rho",
    sigma: "\\sigma",
    Sigma: "\\Sigma",
    tau: "\\tau",
    fi: "\\phi",
    psi: "\\psi",
    omega: "\\omega",
    Omega: "\\Omega",
  };
  type = "EqEx";
  readonly parsedContent: string; // "lorem ipsum \(d=300\mathrm{km\}\) foo \(v_a=\mathrm{\frac{m}{s}}\) bar \(v_b=\frac{m}{s}\)."
  readonly ranges: [number, number][] = []; // [index in variables, index in parsedContent]
  readonly variables: [string, (RPN | Range | number)][] = []; // [name, object]
  readonly unknowns: string[] = []; // name
  readonly formattedUnknowns: [string, string][] = []; // [formatted name, unit]
  readonly order: number[] = []; // order of equations
  readonly answerPrecision: number = 0.02; // such number x that: ans*(100-x)% <= user ans <= ans*(100-x)% returns correct answer

  // content -> parse to latex, extract RPN, Range and number -> return parsed text
  constructor(
    readonly name: string,
    content: string,
    readonly properties: { [key: string]: YAMLType },
  ) {
    super(name, content, properties);
    let segment = 0; // segment 0: problem's content; segment 1: system of equations
    let globalIndex = 0; // global index (different than the index of the current line)
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
        // considered regex: numberR (variable)(_underscore)=(value)(unit)
        // TODO avoid repeating code between .....
        // ................................................
        parsedLine = "";
        while ((m = EquationExercise.numberEqR.exec(line)) !== null) {
          const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
          const formattedName = EquationExercise.convertToGreek(
            m[2] === undefined ? m[1] : `${m[1]}_{${m[2].substring(1)}}`,
          );
          const index = [
            // {0} d= 300 km {1}
            m.index,
            m.index + m[0].length,
          ];
          // ................................................
          const value = parseFloat(m[3]);
          const unit = EquationExercise.convertToLaTeX(m[4]);
          // add space next to the '=' to prevent from matching multiple times
          parsedLine += `${
            line.substring(0, index[0])
          }\\(${formattedName}= ${value}${unit}\\)`,
            line = line.substring(index[1]); // remove this match from line
          this.variables.push([name, value]);
        }
        parsedLine += line;
        // --------------------------------------------------
        // considered regex: unknownEqR (variable)(_underscore)=?(unit)
        line = parsedLine;
        // ................................................
        parsedLine = "";
        while ((m = EquationExercise.unknownEqR.exec(line)) !== null) {
          const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
          const formattedName = EquationExercise.convertToGreek(
            m[2] === undefined ? m[1] : `${m[1]}_{${m[2].substring(1)}}`,
          );
          const index = [
            // {0} x =? {1}
            m.index,
            m.index + m[0].length,
          ];
          // ................................................
          const unit = EquationExercise.convertToLaTeX(m[3]);
          parsedLine += line.substring(0, index[0]) + "\\(" +
            formattedName + "\\)";
          line = line.substring(index[1]); // remove this match
          this.unknowns.push(name);
          this.formattedUnknowns.push([formattedName, unit]);
        }
        parsedLine += line;
        // --------------------------------------------------
        // considered regex: rangeEqR (variable)(_underscore)=[(min);(max);(step)](unit)
        line = parsedLine;
        // ................................................
        parsedLine = "";
        while ((m = EquationExercise.rangeEqR.exec(line)) !== null) {
          const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
          const formattedName = EquationExercise.convertToGreek(
            m[2] === undefined ? m[1] : `${m[1]}_{${m[2].substring(1)}}`,
          );
          const index = [
            // {0} v_a= [40;80;20] m/s {1}
            m.index,
            m.index + m[0].length,
          ];
          // ................................................
          const rangeMin = parseFloat(m[3]);
          const rangeMax = parseFloat(m[4]);
          const step = m[5] !== undefined ? parseFloat(m[5]) : undefined; // TODO: rework
          const unit = EquationExercise.convertToLaTeX(m[6]);
          this.variables.push([name, new Range(rangeMin, rangeMax, step)]);
          parsedLine += `${
            line.substring(0, index[0])
          }\\(${formattedName}= ${unit}\\)`;
          line = line.substring(index[1]); // remove this match
          globalIndex += 2 + index[0] + formattedName.length + 2; // "\(" + name + "= ";
          this.ranges.push([this.variables.length - 1, globalIndex]); // [index in this.variables, index in this.parsedContent]
          globalIndex += unit.length + 2; // LaTeX unit + "\)"
        }
        parsedLine += line;
        parsingContent += parsedLine + "\n";
        globalIndex += line.length + 1; // what's left + '\n'
      } else if (segment == 1) {
        const m = line.match(EquationExercise.equationR);
        if (m === null || m[0] !== line) {
          throw new Error("LINE DOESN'T MATCH PATTERN");
        }
        const name = m[2] === undefined ? m[1] : `${m[1]}${m[2]}`;
        const rpn = new RPN(m[3]);
        this.variables.push([name, rpn]);
        this.order.push(this.variables.length - 1); // index in this.variables
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
      const index = this.ranges[i][0];
      const textIndex = this.ranges[i][1];
      const value = (this.variables[index][1] as Range).rand(rng);
      parsingContent = parsingContent.substr(0, textIndex) +
        value +
        parsingContent.substr(textIndex);
    }
    return {
      type: this.type,
      name: this.name,
      content: {
        main: parsingContent,
        unknowns: this.formattedUnknowns,
      },
    };
  }
  check(seed: number, answer: YAMLType): {
    success: boolean;
  } {
    if (
      !Array.isArray(answer) || answer.some((item) => typeof item !== "number")
    ) {
      throw new Error("ERROR, INVALID ANSWER FORMAT");
    }
    if (answer.length != this.unknowns.length) {
      throw new Error("ERROR, INVALID ANSWER LENGTH");
    }
    const answerDict: {[key: string]: number} = this.unknowns.reduce((a, x, i) => ({...a, x: answer[i]}), {});
    const rng = new RNG(seed);
    const calculated: { [key: string]: number } = {};
    // add already calculated numbers to calculated variables
    for (const [name, val] of this.variables) {
      if (typeof val == "number") {
        calculated[name] = val as number;
      }
    }
    // randomize ranges (in the correct order) and add them to calculated variables
    for (const [index, _] of this.ranges) {
      const name = this.variables[index][0];
      const val = this.variables[index][1];
      if (val instanceof Range) {
        calculated[name] = (val as Range).rand(rng);
      }
    }
    // calculate RPN variables (in the correct order) and add them to calculated variables
    for (let i = 0; i < this.order.length; ++i) {
      const index = this.order[i];
      const name = this.variables[index][0];
      const val = this.variables[index][1];
      if (val instanceof RPN) {
        calculated[name] = (val as RPN).calculate(calculated);
      }
    }
    // go through each unknown and compare the answers to what's calculated
    for (const name of this.unknowns) {
      const correctAns = calculated[name];
      if (name in answerDict) {
        const ans = answerDict[name];
        if (
          ans < (1 - this.answerPrecision) * correctAns ||
          ans > (1 + this.answerPrecision) * correctAns
        ) {
          return { success: false };
        }
      } else {
        throw new Error("UNKNOWN IS NOT IN ANSWER");
      }
    }
    return { success: true };
  }
  static convertToLaTeX(unit: string): string {
    if (unit == "") {
      return "";
    }
    let parsedUnit = "";
    let isFraction = false;
    const r = "\\^([\\-\\+]?[0-9]+)|deg|([a-zA-Z]+|[\\-\\+])|[\\*\\/\\^]";
    const execR = new RegExp(r, "g");
    const testR = new RegExp(`^(${r})+$`);
    if (!testR.test(unit)) {
      throw new Error("INVALID UNIT FORMAT");
    }
    let m: RegExpExecArray | null;
    while ((m = execR.exec(unit)) !== null) {
      if (m[0] == "deg") {
        parsedUnit += "°";
      } else if (m[2] !== undefined) {
        parsedUnit += m[0];
      } else if (m[1] !== undefined) {
        parsedUnit += "^{" + m[1] + "}";
      } else if (m[0] === "*") {
        parsedUnit += "\\cdot";
      } else if (m[0] === "/") {
        parsedUnit = parsedUnit + "}{";
        isFraction = true;
      }
    }
    parsedUnit = `${
      parsedUnit[0] !== "°" ? "\\;" : ""
    }\\mathrm{${(isFraction ? "\\frac{" : "")}${parsedUnit}${(isFraction
      ? "}"
      : "")}}`;
    return parsedUnit;
  }
  static convertToGreek(name: string): string {
    let m: RegExpExecArray | null;
    let parsedName = "";
    while ((m = EquationExercise.greekR.exec(name)) !== null) {
      parsedName += `${name.substring(0, m.index)}${
        EquationExercise.greekAlphabet[m[0]]
      }${name.substring(m.index + m[0].length)}`;
      name = name.substring(m.index + m[0].length); // remove this match from the string
    }
    parsedName += name;
    return parsedName;
  }
}
