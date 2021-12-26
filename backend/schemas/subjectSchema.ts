import { vs } from "../deps.ts";
import { userIdOptions } from "../common/mod.ts";

export const /** id in `schemas.user.subject` */
  subjectSchema = {
    assignees: vs.array({
      each: vs.string({ ...userIdOptions }),
      ifNull: null, //FIXME ? really
    }),
  };
