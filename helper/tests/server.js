import { Server } from 'https://cdn.skypack.dev/@miragejs/server';

export function startServer() {
    new Server({
        routes() {
            this.get('/api/public', () => ([{
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
                }
            ]));
            this.get("/api/reminders", () => ({
                reminders: [],
            }))
        }
    })
    console.log('server online');
}