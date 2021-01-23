import { Server } from 'https://cdn.skypack.dev/@miragejs/server';
import { getBasePath } from './path-manager.js';

export function startServer() {
    new Server({
        routes() {
            this.get('/api/public', () => {
                return JSON.stringify([{
                        "name": "mechanika",
                        "children": [{
                                "name": "kinematyka",
                                "children": [{
                                        "name": "Pociągi dwa",
                                        "children": "pociągi-dwa"
                                    },
                                    {
                                        "name": "Pociągi dwa 2",
                                        "children": "pociągi-dwa-2"
                                    }
                                ]
                            },
                            {
                                "name": "grawitacja",
                                "children": [{
                                        "name": "Pociągi trzy",
                                        "children": "pociągi-trzy"
                                    },
                                    {
                                        "name": "Pociągi trzy 2",
                                        "children": "pociągi-trzy-2"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "name": "fizyka atomowa",
                        "children": [{
                            "name": "rozpad",
                            "children": [{
                                "name": "atom",
                                "children": "atom"
                            }]
                        }]
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    },
                    {
                        "name": "no category",
                        "children": "no-category"
                    }
                ]);
            });
            [
                'pociągi-dwa',
                'pociągi-dwa-2',
                'pociągi-trzy',
                'pociągi-trzy-2'
            ].forEach((url) => {
                this.get('api/public/' + url, () => {
                    let name;
                    switch (url) {
                        case 'pociągi-dwa-2':
                            name = 'Pociągi dwa 2';
                            break;
                        case 'pociągi-trzy':
                            name = 'Pociągi trzy';
                            break;
                        case 'pociągi-trzy-2':
                            name = 'Pociągi trzy 2';
                            break;
                        default:
                            name = 'Pociągi dwa';
                    }
                    return JSON.stringify({
                        "type": "EqEx",
                        "name": name,
                        "content": {
                            "main": "Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\n\rW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?",
                            "imgs": ["https://bulma.io/images/placeholders/480x640.png"],
                            "unknowns": [
                                ["x", "\\mathrm{km}"],
                                ["t", "\\mathrm{s}"]
                            ]
                        }
                    });
                });
            });
            this.get('api/public/atom', () => {
                return JSON.stringify({
                    "type": "EqEx",
                    "name": "Atom",
                    "content": {
                        "main": "Atom ma bardzo krótkie polecenie. Podaj \\(T\\).",
                        "unknowns": [
                            ["T", "\\mathrm{\\frac{1}{s}}"]
                        ]
                    }
                });
            });
            this.get('api/public/no-category', () => {
                return JSON.stringify({
                    "type": "EqEx",
                    "name": "Bez kategorii",
                    "content": {
                        "main": "Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\n\rW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?",
                        "imgs": ["https://bulma.io/images/placeholders/720x240.png", "https://bulma.io/images/placeholders/640x480.png", "https://bulma.io/images/placeholders/240x720.png"],
                        "unknowns": [
                            ["x", "\\mathrm{km}"],
                            ["F", "\\mathrm{N}"],
                            ["t", "\\mathrm{s}"]
                        ]
                    }
                });
            });
            [
                'pociągi-dwa',
                'pociągi-dwa-2',
                'pociągi-trzy',
                'pociągi-trzy-2',
                'atom',
                'no-category'
            ].forEach((url) => {
                this.post('api/public/' + url, (schema, request) => {
                    const attrs = JSON.parse(request.requestBody);
                    const result = [];
                    Object.keys(attrs).forEach((field, i) => {
                        result.push(attrs[field] == Number((1.1 * (i + 1)).toFixed(1)));
                    });
                    return JSON.stringify({ success: result.every((e) => e) });
                });
            })
            this.passthrough(getBasePath() + '/eqex/eqex.html');
            this.passthrough('https://bulma.io/images/placeholders/720x240.png');
            this.passthrough('https://bulma.io/images/placeholders/640x480.png');
            this.passthrough('https://bulma.io/images/placeholders/240x720.png');
        }
    })
    console.log('server online');
}