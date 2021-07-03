// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { TeamType, UserType } from "../types/mod.ts";
import { ITeam, ITeams, IUser } from "../interfaces/mod.ts";

export class Teams implements ITeams {
  constructor(
    private team: ITeam,
    private user: IUser,
  ) {}

  async getAllOf(_user: UserType) {
    // TODO: check assignee if not root
    const teams: TeamType[] = await this.team.getAll();
    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      assignee: team.assignee,
      open: team.invitation !== null,
    }));
  }

  add(name: string, assignee: UserType) {
    return this.team.add({
      name,
      assignee: assignee.id,
      members: [],
      invitation: null,
    });
  }

  delete(id: number) {
    return this.team.delete(id);
  }

  async get(id: number) {
    const team = await this.team.get(id);
    if (!team) return null;
    const { name, assignee, invitation } = team;
    const members: { id: string; name: string; number: number | null }[] = [];
    for (const member of team.members) {
      const user = await this.user.get(member);
      if (user) {
        members.push({
          id: user.id,
          name: user.name,
          number: user.role.name === "student" ? user.role.number : null,
        });
      } else console.warn(`${member} not in team ${id}`);
    }
    return { name, assignee, invitation, members };
  }

  static generateInvitationCode(id: number): string {
    const ntob = (n: number): string => {
      const base64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
        "abcdefghijklmnopqrstuvwxyz0123456789+/";
      return base64[n];
    };
    const randomArray = new Uint8Array(4);
    window.crypto.getRandomValues(randomArray);
    let invitation = ntob(id);
    for (const n of randomArray) {
      invitation += ntob(n % 64);
    }
    return invitation;
  }

  async update(
    id: number,
    invitation?: string,
    assignee?: string,
    name?: string,
  ) {
    const team = await this.team.get(id);
    if (!team) return 1;
    if (invitation === "") team.invitation = Teams.generateInvitationCode(id);
    else if (invitation === "null") team.invitation = null;
    else if (invitation != null) team.invitation = invitation;
    if (name != null) team.name = name;
    if (assignee != null) {
      if (!await this.user.get(assignee)) {
        console.error(`User with id ${assignee} doesn't exist.`);
        return 2;
      }
      team.assignee = assignee;
    }
    if (!await this.team.set(team)) {
      throw new Error(`The team ${id} existed but it doesn't exist.`);
    }
    return 0;
  }
}
