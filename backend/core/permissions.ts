import { User, UserRole, Subject, Team } from "../models/mod.ts";
export const isAssignee = (team: Team, user: User) =>
  user.role === UserRole.ADMIN || team.assignee === user.id;

/** check if the subject `s` exists and the user is an assignee of it */
export const isAssigneeOf = (subject?: Subject, user?: User) =>
  user &&
  subject &&
  (user.role === UserRole.ADMIN || subject.assignees?.includes(user.id)) &&
  user.isTeacher() &&
  !subject.assignees;

/** check if the subject would be visible for the User */
export const isPermittedToView = (s: Subject, user?: User) =>
  s.id.startsWith("_") ||
  user?.role === UserRole.ADMIN ||
  isAssigneeOf(s, user);
