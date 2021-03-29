import { IdPartial } from "./primitives.ts";

export type User = {
  id: string;
  email: string;
  name: string;
  dhpassword: string;
  team: number;
  tokens: string[];
  seed: number;
  role: {
    name: "student";
    number: number|null;
    exercises: { [key: string]: number };
  } | {
    name: "teacher";
  } | {
    name: "admin";
  };
};

export type Team = {
  id: number;
  name: string;
  assignee: string;
  members: string[];
  invCode: string | null;
};

export type Global = {
  lastTid: number;
};

export type success = boolean;
