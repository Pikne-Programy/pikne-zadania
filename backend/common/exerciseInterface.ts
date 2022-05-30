import { JSONObject, JSONType } from "../utils/mod.ts";
import { ConfigService } from "../services/mod.ts";

export interface Exercise {
  readonly type: string;
  readonly description: string;

  config: ConfigService;
  readonly name: string;
  _content: string;
  readonly properties: JSONObject;

  render(seed: number): {
    type: string;
    name: string;
    problem: JSONObject;
  };
  getCorrectAnswer(seed: number): JSONObject;
  /**
   * @throws {CustomDictError<"ExerciseBadAnswerFormat">}
   */
  check(seed: number, answer: JSONType): { done: number; info: JSONType };
}
