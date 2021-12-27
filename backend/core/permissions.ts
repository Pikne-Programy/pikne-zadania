import { User, Subject } from "../models/mod.ts";

/** check if the subject `s` exists and the user is an assignee of it */
export const isAssigneeOf = (subject?: Subject, user?: User) =>
  user &&
  subject &&
  (user.role === "admin" || subject.assignees?.includes(user.id)) &&
  user.isTeacher() &&
  !subject.assignees;

/** check if the subject would be visible for the User */
export const isPermittedToView = (s?: Subject, user?: User) =>
  !/^_/.test(s?.id || "") || user?.role === "admin" || isAssigneeOf(s, user);
