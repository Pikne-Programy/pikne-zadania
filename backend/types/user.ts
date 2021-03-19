export type Role = "user" | "student" | "teacher" | "admin";
export interface User {
  role: Role;
  id: string;
  name: string;
  dhpassword: string; // double hashed password
  tokens: string[];
  seed: number;
}
export interface Student extends User {
  role: "student";
  team: number;
  number: number;
  seed: number;
  exercises: { [key: string]: number };
}
export interface Teacher extends User {
  role: "teacher";
}
export interface Admin extends User {
  role: "admin";
}
export interface Team {
  id: number; // unique
  name: string; // 2d
  assignee: string; // teacher
  members: string[]; // users' ids
  invCode: string | null; // invitation code
}
