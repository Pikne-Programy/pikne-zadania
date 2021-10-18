// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { E2eSuiteContext } from "../e2e.ts";
import { updateCookies } from "./cookies.ts";

export async function login(
  context: E2eSuiteContext,
  credentials: { login: string; hashedPassword: string },
  old?: string,
) {
  try {
    const response = await (await context.request())
      .post("/api/auth/login")
      .send(credentials)
      .expect(200);
    return updateCookies(response, old);
  } catch (e) {
    throw new Error(`login \`${login}\` failed: ${e}`);
  }
}

export async function register(
  context: E2eSuiteContext,
  data: {
    login: string;
    name: string;
    hashedPassword: string;
    number?: number | null;
    invitation: string;
  },
) {
  try {
    if (data.number === undefined) data.number = null;
    await (await context.request())
      .post("/api/auth/register")
      .send(data)
      .expect(200);
  } catch (e) {
    throw new Error(
      `register \`${data.login}\` (${data.invitation}) failed: ${e}`,
    );
  }
}

export async function createTeam(
  context: E2eSuiteContext,
  cookie: string,
  name: string,
) {
  try {
    const response = await (await context.request())
      .post("/api/team/create")
      .set("Cookie", cookie)
      .send({ name })
      .expect(200);
    const body: { teamId?: unknown } = response.body;
    if (
      typeof body === "object" && body !== null &&
      typeof body?.teamId === "number"
    ) {
      return body.teamId;
    }
    throw new Error(`${body}`);
  } catch (e) {
    throw new Error(`team create \`${name}\` failed: ${e}`);
  }
}

export async function updateTeamInvitation(
  context: E2eSuiteContext,
  cookie: string,
  teamId: number,
  invitation: string | null,
) {
  try {
    await (await context.request())
      .post("/api/team/update")
      .set("Cookie", cookie)
      .send({ teamId, invitation })
      .expect(200);
  } catch (e) {
    throw new Error(
      `team invitation update \`${teamId}\` (${invitation}) failed: ${e}`,
    );
  }
}
