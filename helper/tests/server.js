import { Server } from 'https://cdn.skypack.dev/@miragejs/server';

export function startServer() {
    new Server({
        routes() {
            this.get('/api/public', () => ([{
                "name": "mechanika",
                "children": [{
                    "name": "kinematyka",
                    "children": [{
                        "name": "Pociągi dwa 2",
                        "children": "pociągi-dwa"
                    }]
                }]
            }]));
            this.get("/api/reminders", () => ({
                reminders: [],
            }))
        }
    })
    console.log('server online');
}