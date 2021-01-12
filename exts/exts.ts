import EquationExercise from "./equationExercise.ts";
import Exercise from "../exercise.ts";
export default <{
  [key: string]: new (
    name: string,
    context: string,
    properties: { [key: string]: string },
  ) => Exercise;
}> {
  "": EquationExercise,
  "EqEx": EquationExercise,
  "EquationExercise": EquationExercise,
};
