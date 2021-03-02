# Endpoints - v0.2 (discuss at [#25](https://github.com/Pikne-Programy/pikne-zadania/issues/25))

If there is an error (`4xx` or `5xx` status code), the API will return either no content or the JSON object with an error message:

```json
{
  "msg": "<error message>"
}
```

The common errors status codes are:

- 400, when the request is invalid,
- 500, if there is a problem on the server-side.

***

## `GET /api/public`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/public` | get all Exercises | 401 |

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

**note**: Elements of the root list must be subject objects \
**note**: `done` property is stated only when the user is authorized,
it can be `null` or a number from 0 to 1, see [#24](https://github.com/Pikne-Programy/pikne-zadania/issues/24#issuecomment-782939873)

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
    "main": "Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?",
    "imgs": ["1.png", "2.png"],
    "unknowns": [["x", "\\mathrm{km}"], ["t", "\\mathrm{s}"]]
  }
}
```

**note**: `content` is ExT-dependent, shown above is the EqEx one

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

**note**: it's ExT-dependent, what is shown above is appropriate for the EqEx one

***

# **The page below is under construction.**

todo: prettify json

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

**note**: `hashed_password`
**note**: "number" is a number or `null` \
**note**: `login` is an email address (the hard-coded users like `admin` cannot be registered))

***

## `POST /api/login`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/login` |  | 401 |

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

**note**: `hashed_password`

***

## `GET /api/account`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/account` |  | 401 |

**Request**:

```json
```

**Response**:

```json
{
    "name":"User",
    "number": 11,
    "team": 1
}
```

**note**: `team`

***

## `GET /api/teams`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/teams` | get list of (your) teams | 403 |

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
    "name": "2d"
  },
  {
    "id": 3,
    "name": "3d"
  }
]
```

**note**: There is always hard-coded `admin` team with id `0`.

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

**note**:

***

## `POST /api/teams/:id/open`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/open` | change invitation status | - |

**Request**:

```json
"QwErTy58"
```

**Response**:

```json
```

**note**:

***

## `POST /api/teams/:id/close`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/close` | change invitation status | 401, 403, 404 |

**Request**:

```json
```

**Response**:

```json
```

**note**:

***

## `GET /api/teams/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| GET | `/api/teams/:id` |  | 401, 403 (not your team), 404 (only if authorized as admin) |

**Request**:

```json
```

**Response**:

```json
{
  "name": "2d",
  "assignee": "Smith",
  "members": [
    {
      "id": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "name": "User",
      "number": 11
    }
  ]
}
```

**note**: id is hashed email

***

## `DELETE /api/teams/:id/:userid`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/:userid` |  | 404 |

**Request**:

```json
```

**Response**:

```json
```

**note**:

***

## `POST /api/teams/:id/:userid`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id/:userid` | set a new number | - |

**Request**:

```json
34
```

**Response**:

```json
```

**note**:

***

## `POST /api/teams/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/teams/:id` | set a new name of team | - |

**Request**:

```json
"3d"
```

**Response**:

```json
```

**note**:

***

## `POST /api/root/teams/:id`

| Method | URL | Description | Special status codes |
| - | - | - | - |
| POST | `/api/root/teams/:id` | change an assignee | - |

**Request**:

```json
"1057a9604e04b274da5a4de0c8f4b4868d9b230989f8c8c6a28221143cc5a755"
```

**Response**:

```json
```

**note**: you can't change assignee of "Teachers" team
