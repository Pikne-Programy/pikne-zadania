import { User, Subject } from "../models/mod.ts";

/** check if the subject `s` exists and the user is an assignee of it */
export async function isAssigneeOf(subject: Subject, user?: User) {
  if (user === undefined) {
    return false;
  }

  if (!(await subject.exists())) {
    return false;
  }
  if ((await user.role.get()) === "admin") {
    return true;
  }
  const assignees = await subject.assignees.get();

  if (assignees !== null && assignees.includes(user.id)) {
    return true;
  }
  return (await user.role.get()) === "teacher" && assignees === null; // TODO: user.isTeacher
}

/** check if the subject would be visible for the User */
export async function isPermittedToView(s: Subject, user?: User) {
  return !/^_/.test(s.id) || (await user?.role.get()) === "admin"
    ? true
    : isAssigneeOf(s, user);
}
