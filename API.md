# Endpoints - v0.2 (discuss at [#25](https://github.com/Pikne-Programy/pikne-zadania/issues/25))

If there is an error (`4xx` or `5xx` status code), the API will return either no content or the JSON object with an error message:

```json
{
  "msg": "<error message>"
}
```

The common errors status codes are:

- 400, when the request is invalid,
- 401, when the authentication has failed or is required and is not provided,
- 500, if there is a problem on the server-side.

## Table of Content

- [GET /api/public](#get-apipublic)
- [GET /api/public/:subject/:id](#get-apipublicsubjectid)
- [POST /api/public/:subject/:id](#post-apipublicsubjectid)
- [GET /api/public/:subject/static/:file](#get-apipublicsubjectstaticfile)
- [POST /api/register](#post-apiregister)
- [POST /api/login](#post-apilogin)
- [POST /api/logout](#post-apilogout)
- [GET /api/account](#get-apiaccount)
- [GET /api/teams](#get-apiteams)
- [POST /api/teams](#post-apiteams)
- [POST /api/teams/:id/open](#post-apiteamsidopen)
- [POST /api/teams/:id/close](#post-apiteamsidclose)
- [GET /api/teams/:id](#get-apiteamsid)
- [DELETE /api/teams/:id/:userid](#delete-apiteamsiduserid)
- [POST /api/teams/:id/:userid](#post-apiteamsiduserid)
- [POST /api/teams/:id](#post-apiteamsid)
- [POST /api/root/teams/:id](#post-apirootteamsid)

***

## `GET /api/public`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/public` | get all Exercises | - |

**Request**:

```json
```

**Response**:

```json
[
  {
    "name": "fizyka",
    "children": [
      {
        "name": "mechanika",
        "children": [
          {
            "name": "kinematyka",
            "children": [
              {
                "name": "Pociągi dwa",
                "children": "pociagi-dwa",
                "done": 0.34
              }
            ]
          }
        ]
      }
    ]
  }
]
```

**note**: Elements of the root list must be subject objects. \
**note**: `done` property is stated only when the user is authorized,
it can be `null` or a number from 0 to 1, see [#24](https://github.com/Pikne-Programy/pikne-zadania/issues/24#issuecomment-782939873).

***

## `GET /api/public/:subject/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/public/:subject/:id` | get one Exercise | 404 |

**Request**:

```json
```

**Response**:

```json
{
  "type": "EqEx",
  "name": "Pociągi dwa 2",
  "content": {
    "main": "Z miast \\(A\\) i \\(B\\) odległych o \\(d=300\\;\\mathrm{km}\\) wyruszają jednocześnie\ndwa pociągi z prędkościami \\(v_a= 50\\;\\mathrm{\\frac{km}{h}}\\) oraz \\(v_b=70\\;\\mathrm{\\frac{km}{h}}\\).\nW jakiej odległości \\(x\\) od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie \\(t\\) się to stanie?",
    "imgs": [
      "1.png",
      "2.png"
    ],
    "unknowns": [
      ["x", "\\mathrm{km}"],
      ["t", "\\mathrm{s}"]
    ]
  }
}
```

**note**: `content` is ExT-dependent, shown above is the EqEx one. \
**note**: The `content` can contain links to static content. It can be accessed via `GET /api/public/:subject/static/:file` request.

***

## `POST /api/public/:subject/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/public/:subject/:id` | check answers | 404 |

**Request**:

```json
[15.000000000000004, 13]
```

**Response**:

```json
[false, true]
```

**note**: It's ExT-dependent, what is shown above is appropriate for the EqEx one.

***

## `GET /api/public/:subject/static/:file`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/public/:subject/static/:file` | get a static file | 404 |

**Request**:

```json
```

**Response**:

*binary data*

***

## `POST /api/register`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/register` | register a new user | 403 (wrong invitation), 409 (account already exists) |

**Request**:

```json
{
  "login": "user@example.com",
  "name": "User",
  "hashed_password": "r02H/fnQ3M3Xfjqsr3dg8mY78lBDXWoiR0O0JcXW8VM=",
  "number": 11,
  "invitation": "QwErTy58"
}
```

**Response**:

```json
```

**note**: The generation of `hashed_password` is described [here](https://github.com/Pikne-Programy/pikne-zadania/issues/22#issuecomment-789536400). \
**note**: `number` is a number or `null` when it's not provided. \
**note**: `login` is an email address (the hard-coded users like `admin` cannot be registered). \
**note**: The registration doesn't authenticate, there should be a `POST /api/login` request afterwards.

***

## `POST /api/login`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/login` | authenticate | - |

**Request**:

```json
{
  "login": "user@example.com",
  "hashed_password": "r02H/fnQ3M3Xfjqsr3dg8mY78lBDXWoiR0O0JcXW8VM="
}
```

**Response**:

```json
```

**note**: The generation of `hashed_password` is described [here](https://github.com/Pikne-Programy/pikne-zadania/issues/22#issuecomment-789536400).

***

## `POST /api/logout`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/logout` | unauthenticate | - |

**Request**:

```json
```

**Response**:

```json
```

***

## `GET /api/account`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/account` | get info about currently authenticated user | - |

**Request**:

```json
```

**Response**:

```json
{
  "name": "User",
  "number": 11,
  "team": 1
}
```

***

## `GET /api/teams`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/teams` | get list of your teams | 403 |

**Request**:

```json
```

**Response**:

```json
[
  {
    "id": 1,
    "name": "Teachers",
    "assignee": "Smith",
    "open": true
  },
  {
    "id": 2,
    "name": "2d",
    "assignee": "Williams",
    "open": true
  },
  {
    "id": 3,
    "name": "3d",
    "assignee": "Williams",
    "open": false
  }
]
```

**note**: There is always hard-coded `admin` team with id `0`. \
**note**: The authenticated user from `admin` team will get all teams. \
**note**: The authenticated user not from `admin` team will not get the `assignee` properties.

***

## `POST /api/teams`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams` | create new team | 403 |

**Request**:

```json
{
  "name": "2d"
}
```

**Response**:

```json
1
```

**note**: The response is an id of team.

***

## `POST /api/teams/:id/open`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/open` | change invitation code of team and open registration | 403, 404 (only if authorized as admin) |

**Request**:

```json
"QwErTy58"
```

**Response**:

```json
```

***

## `POST /api/teams/:id/close`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/close` | close registration | 403, 404 (only if authorized as admin) |

**Request**:

```json
```

**Response**:

```json
```

***

## `GET /api/teams/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/teams/:id` | get info about team | 403, 404 (only if authorized as admin) |

**Request**:

```json
```

**Response**:

```json
{
  "name": "2d",
  "assignee": "Williams",
  "members": [
    {
      "id": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "name": "User",
      "number": 11
    }
  ]
}
```

**note**: `id` property is a hashed email. \
**note**: You can use the `GET /api/teams/current`.

***

## `DELETE /api/teams/:id/:userid`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| DELETE | `/api/teams/:id/:userid` | unregister the user | 403, 404 |

**Request**:

```json
```

**Response**:

```json
```

***

## `POST /api/teams/:id/:userid`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/:userid` | set a new number | 403, 404 |

**Request**:

```json
34
```

**Response**:

```json
```

***

## `POST /api/teams/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id` | set a new name of team | 403, 404 (only if authorized as admin) |

**Request**:

```json
"3d"
```

**Response**:

```json
```

***

## `POST /api/root/teams/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/root/teams/:id` | change an assignee | 403 |

**Request**:

```json
"1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755"
```

**Response**:

```json
```

**note**: You can't change assignees of teams whose id is less than 2.
