// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

type user = { userId: string };
type team = { teamId: number };
type exercise = { subject: string; exerciseId: string };
type subject = { subject: string };
type description = { description: string };
type whatever = { [key: string]: unknown };
type errors = {
  UserAlreadyExists: user;
  UserNotFound: user;
  UserCredentialsInvalid: user;
  JWTNotFound: whatever;
  JWTNotPresented: description;
  TeamAlreadyExists: team;
  TeamNotFound: team;
  TeamInvitationNotFound: whatever;
  ExerciseBadAnswerFormat: description;
  ExerciseBadFormat: description;
  ExerciseNotFound: exercise;
  ExerciseAlreadyExists: exercise;
  SubjectAlreadyExists: subject;
  SubjectNotFound: subject;
};
export class CustomDictError<
  T extends keyof errors = keyof errors
> extends Error {
  constructor(public type: T, public info: whatever & errors[T]) {
    super(info ? type : `${type}: ${info}`);
  }
}
