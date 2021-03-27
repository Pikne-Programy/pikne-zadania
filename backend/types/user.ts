import { IdPartial } from "./primitives.ts";

export type Users = Student | Teacher | Admin;
type User = {
  id: string;
  email: string;
  name: string;
  dhpassword: string;
  team: number;
  tokens: string[];
  seed: number;
};
export type Student = User & {
  role: "student";
  number: number;
  exercises: { [key: string]: number };
};
export type Teacher = User & {
  role: "teacher";
};
export type Admin = User & {
  role: "admin";
};
export type Team = {
  id: number;
  name: string;
  assignee: string;
  members: string[];
  invCode: string | null;
};

export type UserPart = Omit<IdPartial<Student>, "email"> | Omit<IdPartial<Teacher>, "email"> | Omit<IdPartial<Admin>, "email">;

export type success = boolean;
