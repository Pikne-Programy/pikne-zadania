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
| GET | `/api/public` | get all Exercises | 401? (see [a comment](https://github.com/Pikne-Programy/pikne-zadania/issues/25#issuecomment-783203024)) |

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
