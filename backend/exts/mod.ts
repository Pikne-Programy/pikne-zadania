// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Exercise } from "../types/mod.ts";
import { IConfigService } from "../interfaces/mod.ts";
import EquationExercise from "./eqex/equationExercise.ts";

export default <{
  [key: string]: new (
    cfg: IConfigService,
    name: typeof Exercise.prototype.name,
    context: string,
    properties: typeof Exercise.prototype.properties,
  ) => Exercise;
}> {
  "": EquationExercise,
  "EqEx": EquationExercise,
  "EquationExercise": EquationExercise,
};
