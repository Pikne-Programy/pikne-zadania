// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// TODO: add bad requests
import { assert, assertEquals } from "../test_deps.ts";
import { RoleTestContext } from "./smoke_mod.ts";
import { data } from "./testdata/config.ts";

export async function initSubjectTests(
  t: Deno.TestContext,
  g: RoleTestContext,
) {
  await t.step("Make _easy visible for root only", async () => {
    await (await g.request())
      .post("/api/subject/permit")
      .set("Cookie", g.roles.root)
      .send({
        subject: "_easy",
        assignees: [],
      })
      .expect(200);
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "_easy",
      })
      .expect(200)
      .expect({ assignees: [] });
  });

  await t.step("Student - list (only public subjects)", async () => {
    const response = await (await g.request())
      .get("/api/subject/list")
      .set("Cookie", g.roles.bob)
      .expect(200);
    assert(
      "subjects" in response.body && Array.isArray(response.body.subjects),
    );
    response.body.subjects.sort();
    assertEquals(response.body.subjects, ["easy", "fizyka"]);
  });

  await t.step("Teacher - list (only public subjects)", async () => {
    const response = await (await g.request())
      .get("/api/subject/list")
      .set("Cookie", g.roles.ralph)
      .expect(200);
    assert(
      "subjects" in response.body && Array.isArray(response.body.subjects),
    );
    response.body.subjects.sort();
    assertEquals(response.body.subjects, ["easy", "fizyka"]);
  });

  await t.step("Not logged in - list", async () => {
    const response = await (await g.request())
      .get("/api/subject/list")
      .expect(200);
    assert(
      "subjects" in response.body && Array.isArray(response.body.subjects),
    );
    response.body.subjects.sort();
    assertEquals(response.body.subjects, ["easy", "fizyka"]);
  });

  await t.step("Root - create a public subject", async () => {
    await (await g.request())
      .post("/api/subject/create")
      .set("Cookie", g.roles.root)
      .send({
        subject: "astronomia",
        assignees: [
          data.u.lanny.id,
        ],
      })
      .expect(200);
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "astronomia",
      })
      .expect(200)
      .expect({
        assignees: [
          {
            userId: data.u.lanny.id,
            name: data.u.lanny.name,
          },
        ],
      });
  });

  await t.step("Teacher - create public subject", async () => {
    await (await g.request())
      .post("/api/subject/create")
      .set("Cookie", g.roles.lanny)
      .send({
        subject: "informatyka",
        assignees: null,
      })
      .expect(200);
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "informatyka",
      })
      .expect(200)
      .expect({
        assignees: null,
      });
  });

  await t.step("Student - try to create a subject", async () => {
    await (await g.request())
      .post("/api/subject/create")
      .set("Cookie", g.roles.alice)
      .send({
        subject: "fizyka2",
        assignees: null,
      })
      .expect(403);
  });

  await t.step("Not logged in - try to create a subject", async () => {
    await (await g.request())
      .post("/api/subject/create")
      .send({
        subject: "fizyka2",
        assignees: null,
      })
      .expect(401);
  });

  await t.step(
    "Admin - try to create a subject (name already taken)",
    async () => {
      await (await g.request())
        .post("/api/subject/create")
        .set("Cookie", g.roles.root)
        .send({
          subject: "fizyka",
          assignees: null,
        })
        .expect(409);
    },
  );

  await t.step("Admin - create a subject with no assignees", async () => {
    await (await g.request())
      .post("/api/subject/create")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka2",
        assignees: [],
      })
      .expect(200);
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka2",
      })
      .expect(200)
      .expect({
        assignees: [],
      });
  });

  await t.step("Student - try to get info about public subject", async () => {
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.alice)
      .send({
        subject: "fizyka",
      })
      .expect(403);
  });

  await t.step("Assignee - get info about public subject", async () => {
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.ralph)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({
        "assignees": null,
      });
  });

  await t.step("Root - get info about public subject", async () => {
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({
        "assignees": null,
      });
  });

  await t.step(
    "Not logged in - try to get info about public subject",
    async () => {
      await (await g.request())
        .post("/api/subject/info")
        .send({
          subject: "fizyka",
        })
        .expect(401);
    },
  );

  await t.step("Admin - permit public subject", async () => {
    await (await g.request())
      .post("/api/subject/permit")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
        assignees: [data.u.lanny.id],
      })
      .expect(200);
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({
        assignees: [
          {
            userId: data.u.lanny.id,
            name: data.u.lanny.name,
          },
        ],
      });
  });

  await t.step("Assignee - permit public subject", async () => {
    await (await g.request())
      .post("/api/subject/permit")
      .set("Cookie", g.roles.lanny)
      .send({
        subject: "fizyka",
        assignees: [],
      })
      .expect(200);
    await (await g.request())
      .post("/api/subject/info")
      .set("Cookie", g.roles.root)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({ assignees: [] });
  });

  await t.step("Teacher - try to permit public subject", async () => {
    await (await g.request())
      .post("/api/subject/permit")
      .set("Cookie", g.roles.ralph)
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(403);
  });

  await t.step("Student - try to permit public subject", async () => {
    await (await g.request())
      .post("/api/subject/permit")
      .set("Cookie", g.roles.alice)
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(403);
  });

  await t.step("Not logged in - try to permit public subject", async () => {
    await (await g.request())
      .post("/api/subject/permit")
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(401);
  });
}
