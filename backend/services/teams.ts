// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
// Copyright 2021 Marcin Wykpis <marwyk2003@gmail.com>
// Copyright 2021 Marcin Zepp <nircek-2103@protonmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import { Team, User } from "../models/mod.ts";
import { ITeamFactory, ITeams, IUserFactory } from "../interfaces/mod.ts";

export class Teams implements ITeams {
  constructor(
    private tf: ITeamFactory,
    private uf: IUserFactory,
  ) {}

  async getAllOf(_user: User) {
    // TODO: check assignee if not root
    const teams: Team[] = await this.tf.getAll();
    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      assignee: team.assignee,
      open: team.invitation.get() !== null,
    }));
  }

  add(name: string, assignee: User) {
    return this.tf.add({
      name,
      assignee: assignee.id,
      members: [],
      invitation: null,
    });
  }

  delete(id: number) {
    return this.tf.delete(id);
  }

  async get(id: number) {
    const team = await this.tf.get(id);
    if (!team) return null;
    const { name, assignee } = team;
    const invitation = team.invitation.get();
    const members: { id: string; name: string; number: number | null }[] = [];
    for (const member of team.members.get()) {
      const user = await this.uf.get(member);
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
    const team = await this.tf.get(id);
    if (!team) return 1;
    if (invitation === "") {
      team.invitation.set(Teams.generateInvitationCode(id));
    } else if (invitation === "null") await team.invitation.set(null);
    else if (invitation != null) await team.invitation.set(invitation);
    if (name != null) team.name = name;
    if (assignee != null) {
      if (!await this.uf.get(assignee)) {
        console.error(`User with id ${assignee} doesn't exist.`);
        return 2;
      }
      team.assignee = assignee;
    }
    return 0;
  }
}
