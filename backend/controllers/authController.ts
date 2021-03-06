import { RouterContext } from "../deps.ts";

export class AuthController {
  async register(ctx: RouterContext) {
    ctx.response.status = 201;
    ctx.response.body = {};
  }
  async login(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {};
  }
  async logout(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {};
  }
  async getAccount(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = { "name": "User", "number": 11 };
  }
  async getTeams(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = [
      {
        "id": 1,
        "name": "Teachers",
        "assignee": "Smith",
        "open": true,
      },
      {
        "id": 2,
        "name": "2d",
        "assignee": "Williams",
        "open": true,
      },
      {
        "id": 3,
        "name": "3d",
        "assignee": "Williams",
        "open": false,
      },
    ];
  }
  async createTeam(ctx: RouterContext) {
    ctx.response.status = 201;
    ctx.response.body = 1;
  }
  async openReg(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {};
  }
  async closeReg(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {};
  }
  async teamInfo(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {
      "name": "2d",
      "assignee": "Smith",
      "members": [
        {
          "id":
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          "name": "User",
          "number": 11,
        },
      ],
    };
  }
  async deleteUser(ctx: RouterContext) {
    ctx.response.status = 205;
    ctx.response.body = {};
  }
  async addUser(ctx: RouterContext) {
    ctx.response.status = 201;
    ctx.response.body = {};
  }
  async setTeamName(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {};
  }
  async changeAssignee(ctx: RouterContext) {
    ctx.response.status = 200;
    ctx.response.body = {};
  }
}
export default new AuthController();
