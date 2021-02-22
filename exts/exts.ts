import EquationExercise from "./eqex/equationExercise.ts";
import Exercise from "../exercise.ts";
export default <{
  [key: string]: new (
    name: typeof Exercise.prototype.name,
    context: string,
    properties: typeof Exercise.prototype.properties,
  ) => Exercise;
}> {
  "": EquationExercise,
  "EqEx": EquationExercise,
  "EquationExercise": EquationExercise,
};
