// SPDX-License-Identifier: AGPL-3.0-or-later

import { User, Team, Subject } from "../models/mod.ts";
import { Repository } from "./mod.ts";
import { Injectable } from "../core/ioc/mod.ts";

@Injectable()
export class UserRepository extends Repository.registerFor(User) {}
@Injectable()
export class TeamRepository extends Repository.registerFor(Team) {}
@Injectable()
export class SubjectRepository extends Repository.registerFor(Subject) {}
