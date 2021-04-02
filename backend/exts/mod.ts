// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import EquationExercise from "./eqex/equationExercise.ts";
import { Exercise } from "../types/mod.ts";
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
