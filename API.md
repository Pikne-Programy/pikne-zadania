# Endpoints - v0.3 (discuss at [#34](https://github.com/Pikne-Programy/pikne-zadania/issues/34))

If there is an error (`4xx` or `5xx` status code), the API will return either no content or the JSON object with an error message:

```json
{
  "message": "<error message>"
}
```

The most common errors status codes are:

- 400, when the request is invalid,
- 401, when the authentication failed, or a user didn't authenticate although it is required,
- 500, if there is a problem on the server-side.

## TODO

- discuss permissions
- review the whole document
- rewrite descriptions and check status codes
- add short descriptions in ToC?

## Subject

### `GET /api/subject/list`

| Method | URL                 | Description                | Special status codes |
| ------ | ------------------- | -------------------------- | -------------------- |
| GET    | `/api/subject/list` | fetch list of all subjects |                      |

<!-- TODO: can be used by
anyone
-->

#### Request

```json

```

#### Response

```json
{
  "subjects": ["fizyka", "_fizyka", "astronomia"]
}
```

#### Notes

- There are only subjects available for the User. <!--subjects-:only-available-->

---

### `POST /api/subject/create`

| Method | URL                   | Description        | Special status codes         |
| ------ | --------------------- | ------------------ | ---------------------------- |
| POST   | `/api/subject/create` | create new subject | 403, 409 (id already exists) |

<!-- TODO: can be used by
teachers
-->

#### Request

```json
{
  "subject": "fizyka",
  "assignees": [
    "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755"
  ]
}
```

#### Response

```json

```

#### Notes

- Subjects that begins with the `_` character are private and not visible to unauthorized users. <!--subject+:underscore-prefix-->
- Only the Admin will be managing the subject if the `assignees` property equals `[]`. <!--assignees+:empty-warning-->
- `subject` is a name and an id simultaneously. It has to be unique. <!--subject+:unique-->
- If the `assignees` property equals `null`, all teachers will be able to manage the subject. <!--assignees+:def-->

---

### `POST /api/subject/info`

| Method | URL                 | Description                  | Special status codes |
| ------ | ------------------- | ---------------------------- | -------------------- |
| POST   | `/api/subject/info` | get list of authorized users | 403, 404             |

<!-- TODO: can be used by
all assignees // TODO: make it in code
and teachers if public
-->

#### Request

```json
{
  "subject": "fizyka"
}
```

#### Response

```json
{
  "assignees": [
    {
      "userId": "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755",
      "name": "Smith"
    }
  ]
}
```

#### Notes

- If the `assignees` property equals `null`, all teachers can modify the subject. <!--assignees-:def-->

---

### `POST /api/subject/permit`

| Method | URL                   | Description                     | Special status codes |
| ------ | --------------------- | ------------------------------- | -------------------- |
| POST   | `/api/subject/permit` | change list of authorized users | 403, 404             |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "assignees": [
    "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755"
  ]
}
```

#### Response

```json

```

#### Notes

- If the `assignees` property equals `null`, all teachers will be able to manage the subject. <!--assignees+:def-->

---

## Problem managing

### `POST /api/subject/problem/get`

| Method | URL                        | Description        | Special status codes |
| ------ | -------------------------- | ------------------ | -------------------- |
| POST   | `/api/subject/problem/get` | render an exercise | 403, 404             |

<!-- TODO: can be used by
anyone if subject is public and exercise is listed in hierarchy
if not: only assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "exerciseId": "pociagi-dwa",
  "seed": 0
}
```

#### Response

```json
{
  "type": "EqEx",
  "name": "Pociągi dwa 2",
  "done": 0.34,
  "problem": {
    "main": "Z miast \\(A\\) i \\(B\\) odległych o \\(d=300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_a= 50\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_b=70\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?",
    "img": ["1.png", "2.png"],
    "unknown": [
      ["x", "\\mathrm{km}"],
      ["t", "\\mathrm{s}"]
    ]
  },
  "correctAnswer": {
    "answers": [2.5, 125]
  }
}
```

#### Notes

- Only the Teacher and the Admin can use the `seed` property. Otherwise, the database provides it. <!--seed+?:teacher|admin-->
- Only the Teacher and the Admin receive the `correctAnswer` property. <!--correctAnswer-:teacher|admin-->
- The `done` property can be `null` or a number from 0 up to and including 1, see [#24](https://github.com/Pikne-Programy/pikne-zadania/issues/24#issuecomment-782939873). <!--done-:def-->
- The `problem` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--problem-:ext-dependent-->
- The `problem` property can contain links to static content. The User can access it via [the `GET /api/subject/static/:subject/:filename` request](#get-apisubjectstaticsubjectfilename). <!--problem-:links2static-->
<!-- TODO: 403 vs 401; don't question -->

---

### `POST /api/subject/problem/update`

<!-- TODO: change name to answer in v0.4 -->

| Method | URL                           | Description   | Special status codes |
| ------ | ----------------------------- | ------------- | -------------------- |
| POST   | `/api/subject/problem/update` | store answers | 404                  |

<!-- TODO: can be used by
anyone if subject is public and exercise is listed in hierarchy
if not: only assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "exerciseId": "pociagi-dwa",
  "answer": {
    "answers": [15.000000000000004, 13]
  }
}
```

#### Response

```json
{
  "info": [false, true]
}
```

#### Notes

- The `info` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--info-:ext-dependent-->

---

## Static files managing

### `GET /api/subject/static/:subject/:filename`

| Method | URL                                      | Description       | Special status codes |
| ------ | ---------------------------------------- | ----------------- | -------------------- |
| GET    | `/api/subject/static/:subject/:filename` | get a static file | 403, 404             |

<!-- TODO: can be used by
anyone if subject is public
if not: only assignees
-->

#### Notes

- There should be binary data with an appropriate Content-type in the response. <!--/static-:binary-data-->

---

### `PUT /api/subject/static/:subject/:filename`

| Method | URL                                      | Description          | Special status codes |
| ------ | ---------------------------------------- | -------------------- | -------------------- |
| PUT    | `/api/subject/static/:subject/:filename` | upload a static file | 403, 404             |

<!-- TODO: can be used by
assignees
-->

#### Notes

- The request data should follow the `multipart/form-data` Content-type. <!--/static+:multipart-->

---

## Hierarchy modification

### `POST /api/subject/hierarchy/get`

| Method | URL                          | Description                           | Special status codes |
| ------ | ---------------------------- | ------------------------------------- | -------------------- |
| POST   | `/api/subject/hierarchy/get` | get hierarchy of exercises in subject | 404                  |

<!-- TODO: can be used by
anyone
assignees if private
-->

#### Request

```json
{
  "subject": "fizyka",
  "raw": false
}
```

#### Response

<!-- TODO: add "type" -->

```json
[
  {
    "name": "",
    "children": [
      {
        "name": "Kula 2",
        "children": "kula-2"
      }
    ]
  },
  {
    "name": "mechanika",
    "children": [
      {
        "name": "kinematyka",
        "children": [
          {
            "name": "Pociągi dwa 2",
            "children": "pociagi-dwa",
            "description": "Z miast \\(A\\) i \\(B\\) odległych o \\(d=300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_a= 50\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_b=70\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?",
            "done": 0.34
          }
        ]
      }
    ]
  }
]
```

#### Notes

- If the `raw` property equals `false`, there is the `description` property and can be the optional `done` property if the User is authenticated. <!--description-&done-?:raw=false-->
- If the `raw` property equals `false` and the User is authorized, there is a `{"name": "", children: [...]}` (sub-subject) object with all exercises not listed in the hierarchy. <!--/hierarchy.subsubject:exs-not-listed-->
- The `description` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--description-:ext-dependent-->
- The `done` property can be `null` or a number from 0 up to and including 1, see [#24](https://github.com/Pikne-Programy/pikne-zadania/issues/24#issuecomment-782939873). <!--done-:def-->

---

### `POST /api/subject/hierarchy/set`

| Method | URL                          | Description                           | Special status codes |
| ------ | ---------------------------- | ------------------------------------- | -------------------- |
| POST   | `/api/subject/hierarchy/set` | set hierarchy of exercises in subject | 404                  |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "hierarchy": [
    {
      "name": "mechanika",
      "children": [
        {
          "name": "kinematyka",
          "children": [
            {
              "children": "pociagi-dwa"
            }
          ]
        }
      ]
    }
  ]
}
```

#### Response

```json

```

#### Notes

- none

---

## Exercise modification

### `POST /api/subject/exercise/list`

| Method | URL                          | Description                    | Special status codes |
| ------ | ---------------------------- | ------------------------------ | -------------------- |
| POST   | `/api/subject/exercise/list` | get all exercises from subject | 403, 404             |

<!-- TODO: can be used by
anyone
assignees if private
-->

#### Request

```json
{
  "subject": "_fizyka"
}
```

#### Response

```json
{
  "exercises": ["pociagi-dwa", "kula-2"]
}
```

#### Notes

- none

---

### `POST /api/subject/exercise/add`

| Method | URL                         | Description      | Special status codes         |
| ------ | --------------------------- | ---------------- | ---------------------------- |
| POST   | `/api/subject/exercise/add` | add new exercise | 403, 409 (id already exists) |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "exerciseId": "pociagi-dwa",
  "content": "---\ntype: EqEx\nname: Pociągi dwa 2\n---\nZ miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n"
}
```

#### Response

```json

```

#### Notes

- The `content` property can contain links to static content. The User can upload it via [the `PUT /api/subject/static/:subject/:filename` request](#put-apisubjectstaticsubjectfilename). <!--content+:links2static-->

---

### `POST /api/subject/exercise/get`

| Method | URL                         | Description                | Special status codes |
| ------ | --------------------------- | -------------------------- | -------------------- |
| POST   | `/api/subject/exercise/get` | get content of an exercise | 403, 404             |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "exerciseId": "pociagi-dwa"
}
```

#### Response

```json
{
  "content": "---\ntype: EqEx\nname: Pociągi dwa 2\n---\nZ miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n"
}
```

#### Notes

- none

---

### `POST /api/subject/exercise/update`

| Method | URL                            | Description               | Special status codes |
| ------ | ------------------------------ | ------------------------- | -------------------- |
| POST   | `/api/subject/exercise/update` | update exercise's content | 403, 404             |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "subject": "fizyka",
  "exerciseId": "pociagi-dwa",
  "content": "---\ntype: EqEx\nname: Pociągi dwa 2\n---\nZ miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n"
}
```

#### Response

```json

```

#### Notes

- Only the `content` property is changeable. Changing an `exerciseId` fails or overwrites an old exercise. <!--content+:only-changeable-->

---

### `POST /api/subject/exercise/preview`

| Method | URL                             | Description         | Special status codes |
| ------ | ------------------------------- | ------------------- | -------------------- |
| POST   | `/api/subject/exercise/preview` | preview an exercise | 403, 404             |

<!-- TODO: can be used by
authorized
-->

#### Request

```json
{
  "content": "---\ntype: EqEx\nname: Pociągi dwa 2\n---\nZ miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n",
  "seed": 0
}
```

#### Response

```json
{
  "type": "EqEx",
  "name": "Pociągi dwa 2",
  "problem": {
    "main": "Z miast \\(A\\) i \\(B\\) odległych o \\(d=300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_a= 50\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_b=70\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?",
    "img": ["1.png", "2.png"],
    "unknown": [
      ["x", "\\mathrm{km}"],
      ["t", "\\mathrm{s}"]
    ]
  },
  "correctAnswer": {
    "answers": [2.5, 125]
  }
}
```

#### Notes

- The `seed` property is optional. <!--seed+?-->
- The `problem` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--problem-:ext-dependent-->
- The `problem` property can contain links to static content. The User can access it via [the `GET /api/subject/static/:subject/:filename` request](#get-apisubjectstaticsubjectfilename). <!--problem-:links2static-->

---

## Auth

### `POST /api/auth/register`

| Method | URL                  | Description         | Special status codes                                 |
| ------ | -------------------- | ------------------- | ---------------------------------------------------- |
| POST   | `/api/auth/register` | register a new user | 403 (wrong invitation), 409 (account already exists) |

<!-- TODO: can be used by
anyone
-->

#### Request

```json
{
  "login": "user@example.com",
  "name": "User",
  "hashedPassword": "r02H/fnQ3M3Xfjqsr3dg8mY78lBDXWoiR0O0JcXW8VM=",
  "number": 11,
  "invitation": "QwErTy58"
}
```

#### Response

```json

```

#### Notes

- This request doesn't authenticate, unlike [a `POST /api/auth/login` one](#post-apiauthlogin). <!--/register:not-authenticate-->
- The `login` property is an email address. With this request, it is not possible to register hard-coded users (like `root`). <!--login+:email!root-->
- The description of the `hashedPassword` property generation is [here](https://github.com/Pikne-Programy/pikne-zadania/issues/22#issuecomment-789536400). <!--hashedPassword+:def-->
- The `number` property is a number or `null`. <!--number+:def-->

---

### `POST /api/auth/login`

| Method | URL               | Description  | Special status codes |
| ------ | ----------------- | ------------ | -------------------- |
| POST   | `/api/auth/login` | authenticate | -                    |

<!-- TODO: can be used by
anyone
-->

#### Request

```json
{
  "login": "user@example.com",
  "hashedPassword": "r02H/fnQ3M3Xfjqsr3dg8mY78lBDXWoiR0O0JcXW8VM="
}
```

#### Response

```json

```

#### Notes

- The description of the `hashedPassword` property generation is [here](https://github.com/Pikne-Programy/pikne-zadania/issues/22#issuecomment-789536400). <!--hashedPassword+:def-->

---

### `POST /api/auth/logout`

| Method | URL                | Description    | Special status codes |
| ------ | ------------------ | -------------- | -------------------- |
| POST   | `/api/auth/logout` | unauthenticate | -                    |

<!-- TODO: can be used by
authorized
-->

#### Request

```json

```

#### Response

```json

```

#### Notes

- none

---

## User

### `POST /api/user/info`

| Method | URL              | Description           | Special status codes |
| ------ | ---------------- | --------------------- | -------------------- |
| POST   | `/api/user/info` | get info about a user | 403, 404             |

<!-- TODO: can be used by
authorized if a request is referring to the User
assignees of the team of the User in request
-->

#### Request

```json
{
  "userId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

#### Response

```json
{
  "name": "User",
  "teamId": 2,
  "number": 11
}
```

#### Notes

- Omitting the `userId` property causes using the User's one. <!--userId+?:ommitting=db-->
- The `number` property is a number or `null`. <!--number+:def-->

---

### `POST /api/user/update`

| Method | URL                | Description        | Special status codes |
| ------ | ------------------ | ------------------ | -------------------- |
| POST   | `/api/user/update` | update User's data | 403, 404             |

<!-- TODO: can be used by
assignees of the team of the User in request
-->

#### Request

```json
{
  "userId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "number": 33
}
```

#### Response

```json

```

#### Notes

- Only `number` and `name` properties are changeable. <!--#changeable(number,name)-->
- The `number` property is a number or `null`. <!--number+:def-->

---

### `POST /api/user/delete`

| Method | URL                | Description       | Special status codes |
| ------ | ------------------ | ----------------- | -------------------- |
| POST   | `/api/user/delete` | unregister a user | 403, 404             |

  <!-- TODO: can be used by
  assignees of the team of the User in request
  -->

#### Request

```json
{
  "userId": "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755"
}
```

#### Response

```json

```

#### Notes

- none

---

## Team

### `GET /api/team/list`

| Method | URL              | Description       | Special status codes |
| ------ | ---------------- | ----------------- | -------------------- |
| GET    | `/api/team/list` | get list of teams | 403                  |

<!-- TODO: can be used by
teachers
-->

#### Request

```json

```

#### Response

```json
[
  {
    "teamId": 1,
    "name": "Teachers",
    "assignee": {
      "userId": "4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2",
      "name": "root"
    },
    "invitation": "QwErTy58"
  },
  {
    "teamId": 2,
    "name": "2d",
    "assignee": {
      "userId": "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755",
      "name": "Smith"
    },
    "invitation": null
  },
  {
    "teamId": 3,
    "name": "3d",
    "assignee": {
      "userId": "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755",
      "name": "Smith"
    },
    "invitation": null
  }
]
```

#### Notes

- There is always a hard-coded `admin` team with id `0`. <!--[teams]:admin-id-0-->
- If the User can manage a team, there is the `invitation` property there. <!--invitation-?:if-can-manage-->
- When a team has closed registration, the `invitation` property is `null`. <!--invitation-:def-->

---

### `POST /api/team/create`

| Method | URL                | Description     | Special status codes |
| ------ | ------------------ | --------------- | -------------------- |
| POST   | `/api/team/create` | create new team | 403                  |

<!-- TODO: can be used by
teachers
-->

#### Request

```json
{
  "name": "2d"
}
```

#### Response

```json
{
  "teamId": 2
}
```

#### Notes

- none

---

### `POST /api/team/info`

| Method | URL              | Description         | Special status codes |
| ------ | ---------------- | ------------------- | -------------------- |
| POST   | `/api/team/info` | get info about team | 403, 404             |

<!-- TODO: can be used by
teachers
-->

#### Request

```json
{
  "teamId": 2
}
```

#### Response

```json
{
  "name": "2d",
  "assignee": {
    "userId": "1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755",
    "name": "Smith"
  },
  "invitation": "QwErTy58",
  "members": [
    {
      "userId": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "name": "User",
      "number": 11
    }
  ]
}
```

#### Notes

- The Student will not receive the `invitation` property and any of `userId` properties. <!--invitation&userId-:!student-->
- When a team has closed registration, the `invitation` property is `null`. <!--invitation-:def-->

---

### `POST /api/team/update`

| Method | URL                | Description        | Special status codes                     |
| ------ | ------------------ | ------------------ | ---------------------------------------- |
| POST   | `/api/team/update` | change team's data | 403, 404, 409 (invitation code is taken) |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "teamId": 2,
  "invitation": "QwErTy58"
}
```

#### Response

```json

```

#### Notes

- Only a teacher can be an assignee of a team. <!--assgignee+:only-teacher-->
- Only `invitation`, `assignee` and `name` properties are changeable. <!--#changeable(invitation,assignee,name)-->
- The `invitation` property can also be an empty string `""` (in that case, it will be random) or `null` (in that case, registration will be closed). <!--invitation+:gen-def-->

---

### `POST /api/team/delete`

| Method | URL                | Description   | Special status codes |
| ------ | ------------------ | ------------- | -------------------- |
| POST   | `/api/team/delete` | delete a team | 403, 404             |

<!-- TODO: can be used by
assignees
-->

#### Request

```json
{
  "teamId": 2
}
```

#### Response

```json

```

#### Notes

- none

---

## Notes directory

<details>
<summary>expand</summary>

- The `seed` property is optional. <!--seed+?-->
- Only the Teacher and the Admin can use the `seed` property. Otherwise, the database provides it. <!--seed+?:teacher|admin-->

- The `content` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--content-:ext-dependent-->
- The `description` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--description-:ext-dependent-->
- The `info` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--info-:ext-dependent-->
- The `problem` property is dependent on exercise type (ExT). The one shown above is the EquationExercise (EqEx) one. <!--problem-:ext-dependent-->

- The `content` property can contain links to static content. The User can upload it via [the `PUT /api/subject/static/:subject/:filename` request](#put-apisubjectstaticsubjectfilename). <!--content+:links2static-->
- The `problem` property can contain links to static content. The User can access it via [the `GET /api/subject/static/:subject/:filename` request](#get-apisubjectstaticsubjectfilename). <!--problem-:links2static-->

- If the `assignees` property equals `null`, all teachers will be able to manage the subject. <!--assignees+:def-->
- If the `assignees` property equals `null`, all teachers can modify the subject. <!--assignees-:def-->
- The `done` property can be `null` or a number from 0 up to and including 1, see [#24](https://github.com/Pikne-Programy/pikne-zadania/issues/24#issuecomment-782939873). <!--done-:def-->
- The description of the `hashedPassword` property generation is [here](https://github.com/Pikne-Programy/pikne-zadania/issues/22#issuecomment-789536400). <!--hashedPassword+:def-->
- When a team has closed registration, the `invitation` property is `null`. <!--invitation-:def-->
- The `number` property is a number or `null`. <!--number+:def-->

- There is always a hard-coded `admin` team with id `0`. <!--[teams]:admin-id-0-->
- Only the Admin will be managing the subject if the `assignees` property equals `[]`. <!--assignees+:empty-warning-->
- Subjects that begins with the `_` character are private and not visible to unauthorized users. <!--subject+:underscore-prefix-->
- `subject` is a name and an id simultaneously. It has to be unique. <!--subject+:unique-->
- Only a teacher can be an assignee of a team. <!--assgignee+:only-teacher-->

- Only the `content` property is changeable. Changing an `exerciseId` fails or overwrites an old exercise. <!--content+:only-changeable-->
- Only `invitation`, `assignee` and `name` properties are changeable. <!--#changeable(invitation,assignee,name)-->
- Only `number` and `name` properties are changeable. <!--#changeable(number,name)-->

- Omitting the `userId` property causes using the User's one. <!--userId+?:ommitting=db-->
- The `invitation` property can also be an empty string `""` (in that case, it will be random) or `null` (in that case, registration will be closed). <!--invitation+:gen-def-->
- If the User can manage a team, there is the `invitation` property there. <!--invitation-?:if-can-manage-->
- The Student will not receive the `invitation` property and any of `userId` properties. <!--invitation&userId-:!student-->
- The `login` property is an email address. With this request, it is not possible to register hard-coded users (like `root`). <!--login+:email!root-->
- This request doesn't authenticate, unlike [a `POST /api/auth/login` one](#post-apiauthlogin). <!--/register:not-authenticate-->
- There should be binary data with an appropriate Content-type in the response. <!--/static-:binary-data-->
- The request data should follow the `multipart/form-data` Content-type. <!--/static+:multipart-->
- If the `raw` property equals `false` and the User is authorized, there is a `{"name": "", children: [...]}` (sub-subject) object with all exercises not listed in the hierarchy. <!--/hierarchy.subsubject:exs-not-listed-->

- Only the Teacher and the Admin receive the `correctAnswer` property. <!--correctAnswer-:teacher|admin-->
- If the `raw` property equals `false`, there is the `description` property and can be the optional `done` property if the User is authenticated. <!--description-&done-?:raw=false-->
- There are only subjects available for the User. <!--subjects-:only-available-->

</details>
