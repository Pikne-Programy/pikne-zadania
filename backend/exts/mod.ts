// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Exercise } from "../common/mod.ts";
import { ConfigService } from "../services/mod.ts";
import EquationExercise from "./eqex/equationExercise.ts";

// TODO: move it to the Config

export default <{
  [key: string]: new (
    cfg: ConfigService,
    name: Exercise["name"],
    context: string,
    properties: Exercise["properties"],
  ) => Exercise;
}> {
  "": EquationExercise,
  EqEx: EquationExercise,
  EquationExercise: EquationExercise,
};
