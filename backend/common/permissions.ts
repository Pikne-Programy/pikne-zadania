import {
  Ability,
  AbilityBuilder,
  AbilityClass,
  ExtractSubjectType,
  InferSubjects,
} from "../deps.ts";
import { Guest, Subject, Team, User, UserRoles } from "../models/mod.ts";

type Models =
  | InferSubjects<
    //
    typeof User | typeof Subject | typeof Team
  >
  | typeof ALL;

const ALL = "all"; //special model that allow every other

export enum Actions {
  MANAGE = "manage", //special action that allow every other

  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",

  VIEW = "view",
  UPDATE_PROBLEM = "update_problem",
  READ_CORRECT_ANSWER = "read_correct_answer",
  READ_FULL_INFO = "read_full_info",
  READ_PARTIAL_INFO = "read_partial_info",
  READ_INVITATION = "read_invitation",
}

export type ATuple = [Actions, Models];

const builder = () =>
  new AbilityBuilder<Ability<ATuple>>(Ability as AbilityClass<Ability<ATuple>>);

const options = {
  // deno-lint-ignore ban-types
  detectSubjectType: ({ constructor }: object) =>
    constructor as ExtractSubjectType<Models>,
  anyAction: Actions.MANAGE,
  anySubjectType: ALL,
};

export const isUser = (userOrGuest: User | Guest): userOrGuest is User =>
  //@ts-ignore property 'id' exists on user only
  "id" in userOrGuest;

export const createAbility = (user: User | Guest) => {
  const { can, cannot: _cannot, /**/ rules } = builder();

  if (!isUser(user)) {
    //guest permission here
    //TODO
    return new Ability(rules, options);
  }

  if (user.role === UserRoles.ADMIN) {
    can(Actions.MANAGE, ALL);
  }

  // TEAM
  can(Actions.READ, Team, {
    id: user.team,
  });

  if (user.role === UserRoles.TEACHER) {
    can([Actions.CREATE, Actions.READ, Actions.READ_PARTIAL_INFO], Team);
    can(
      [
        Actions.UPDATE,
        Actions.DELETE,
        Actions.READ_INVITATION,
        Actions.READ_FULL_INFO,
      ],
      Team,
      {
        assignee: user.id,
      },
    );
  }
  // SUBJECT
  can(Actions.READ, Subject, {
    assignees: { $in: [user.id] },
  });

  if (user.role === UserRoles.TEACHER) {
    can(Actions.CREATE, Subject);
    can([Actions.READ, Actions.UPDATE, Actions.READ_CORRECT_ANSWER], Subject, {
      assignees: null,
    });
  }

  can(
    [Actions.READ, Actions.UPDATE_PROBLEM, Actions.READ_CORRECT_ANSWER],
    Subject,
    {
      id: { $regex: /^_/ }, //isPublic
    },
  );

  // USER

  // implementing user is problematic
  // because relations are id only so missing additional data

  return new Ability(rules, options);
};
