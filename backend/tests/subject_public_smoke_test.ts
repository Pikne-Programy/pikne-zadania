// Copyright 2021 Michał Szymocha <szymocha.michal@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

// TODO: add bad requests
import { test, TestSuite } from "../test_deps.ts";
import { roleSuite } from "./role.ts";
import { data } from "./testdata/config.ts";

const publicSubject = new TestSuite({
  name: "publicSubject",
  suite: roleSuite,
});

test(
  publicSubject,
  "Make _fizyka visible for root only",
  async (context) => {
    await (await context.request())
      .post("/api/subject/permit")
      .set("Cookie", context.roles.root)
      .send({
        subject: "_fizyka",
        assignees: [],
      })
      .expect(200);
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "_fizyka",
      })
      .expect(200)
      .expect({ assignees: [] });
  },
);

test(
  publicSubject,
  "Student - list (only public subjects)",
  async (context) => {
    await (await context.request())
      .get("/api/subject/list")
      .set("Cookie", context.roles.student2)
      .expect(200)
      .expect({
        "subjects": ["fizyka"],
      });
  },
);

test(
  publicSubject,
  "Teacher - list (only public subjects)",
  async (context) => {
    await (await context.request())
      .get("/api/subject/list")
      .set("Cookie", context.roles.teacher2)
      .expect(200)
      .expect({
        "subjects": ["fizyka"],
      });
  },
);

test(
  publicSubject,
  "Not logged in - list",
  async (context) => {
    await (await context.request())
      .get("/api/subject/list")
      .expect(200)
      .expect({
        "subjects": ["fizyka"],
      });
  },
);

test(
  publicSubject,
  "Root - create a public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/create")
      .set("Cookie", context.roles.root)
      .send({
        subject: "astronomia",
        assignees: [
          data.teacher.id,
        ],
      })
      .expect(200);
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "astronomia",
      })
      .expect(200)
      .expect({
        assignees: [
          {
            userId: data.teacher.id,
            name: data.teacher.name,
          },
        ],
      });
  },
);

test(
  publicSubject,
  "Teacher - create public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/create")
      .set("Cookie", context.roles.teacher)
      .send({
        subject: "informatyka",
        assignees: null,
      })
      .expect(200);
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "informatyka",
      })
      .expect(200)
      .expect({
        assignees: null,
      });
  },
);

test(publicSubject, "Student - try to create a subject", async (context) => {
  await (await context.request())
    .post("/api/subject/create")
    .set("Cookie", context.roles.student)
    .send({
      subject: "fizyka2",
      assignees: null,
    })
    .expect(403);
});

test(
  publicSubject,
  "Not logged in - try to create a subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/create")
      .send({
        subject: "fizyka2",
        assignees: null,
      })
      .expect(401);
  },
);

test(
  publicSubject,
  "Admin - try to create a subject (name already taken)",
  async (context) => {
    await (await context.request())
      .post("/api/subject/create")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(409);
  },
);

test(
  publicSubject,
  "Admin - create a subject with no assignees",
  async (context) => {
    await (await context.request())
      .post("/api/subject/create")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka2",
        assignees: [],
      })
      .expect(200);
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka2",
      })
      .expect(200)
      .expect({
        assignees: [],
      });
  },
);

test(
  publicSubject,
  "Student - try to get info about public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.student)
      .send({
        subject: "fizyka",
      })
      .expect(403);
  },
);

test(
  publicSubject,
  "Assignee - get info about public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.teacher2)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({
        "assignees": null,
      });
  },
);

test(
  publicSubject,
  "Root - get info about public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({
        "assignees": null,
      });
  },
);

test(
  publicSubject,
  "Not logged in - try to get info about public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/info")
      .send({
        subject: "fizyka",
      })
      .expect(401);
  },
);

test(
  publicSubject,
  "Admin - permit public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/permit")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka",
        assignees: [data.teacher.id],
      })
      .expect(200);
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({
        assignees: [
          {
            userId: data.teacher.id,
            name: data.teacher.name,
          },
        ],
      });
  },
);

test(
  publicSubject,
  "Assignee - permit public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/permit")
      .set("Cookie", context.roles.teacher)
      .send({
        subject: "fizyka",
        assignees: [],
      })
      .expect(200);
    await (await context.request())
      .post("/api/subject/info")
      .set("Cookie", context.roles.root)
      .send({
        subject: "fizyka",
      })
      .expect(200)
      .expect({ assignees: [] });
  },
);

test(
  publicSubject,
  "Teacher - try to permit public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/permit")
      .set("Cookie", context.roles.teacher2)
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(403);
  },
);

test(
  publicSubject,
  "Student - try to permit public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/permit")
      .set("Cookie", context.roles.student)
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(403);
  },
);

test(
  publicSubject,
  "Not logged in - try to permit public subject",
  async (context) => {
    await (await context.request())
      .post("/api/subject/permit")
      .send({
        subject: "fizyka",
        assignees: null,
      })
      .expect(401);
  },
);
