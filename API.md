# Endpoints (discuss at [#1](https://github.com/Pikne-Programy/pikne-zadania/issues/1))

If there is an error (`4xx` or `5xx` status code), the API will return either no content or the JSON object with an error message:
```
{
  "msg": "<error message>"
}
```

## `GET /api/public`
| Method | URL | Description |
| - | - | - |
| GET | `/api/public` | get all Exercises |

**Request**:
```json
```

**Response**:
```json
[
 {
  "name": "mechanika",
  "children": [
   {
    "name": "kinematyka",
    "children": [
     {
      "name": "Pociągi dwa 2",
      "children": "pociągi-dwa"
     }
    ]
   }
  ]
 }
]
```

***

## `GET /api/public/:id`
| Method | URL | Description |
| - | - | - |
| GET | `/api/public/:id` | get one Exercise |

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
    "unknowns": [["\\(x\\)", "\\(\\mathrm{km}\\)"], ["\\(t\\)", "\\(\\mathrm{s}\\)"]]
  }
}
```
**note**: `content` is ExT-dependent, shown above is the EqEx one

***

## `POST /api/public/:id`
| Method | URL | Description |
| - | - | - |
| POST | `/api/public/:id` | check answers |

**Request**:
```json
{
  "x": 15.000000000000004,
  "t": 13
}
```

**Response**:
```json
{
  "success": false
}
```