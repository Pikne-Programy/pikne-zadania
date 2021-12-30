// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later
export enum UserRole {
  STUDENT = "student",
  TEACHER = "teacher",
  ADMIN = "admin",
}

export class User {
  id!: string;
  login!: string;
  name!: string;
  dhPassword!: string; // double hashed password
  team!: number;
  seed?: number;
  role!: UserRole;
  number?: number;
  tokens!: string[];
  exercises!: { [key: string]: number };

  constructor(data: Omit<User, "isTeacher">) {
    Object.assign(this, data);
  }

  isTeacher() {
    return [UserRole.TEACHER, UserRole.ADMIN].includes(this.role);
  }
}
