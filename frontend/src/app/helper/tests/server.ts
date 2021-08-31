/* eslint-disable no-console */
import { createServer, Response } from 'miragejs';
import { Account } from '../../account/account.service';

interface ExerciseTree {
    type?: string;
    name: string;
    children: ExerciseTree[] | string;
    done?: number | null;
    desc?: string;
}

interface Team {
    id: number;
    name: string;
    assignee: string;
    invitation: string | null;
}

interface User {
    id: string;
    name: string;
    number?: number | null;
}

export function startServer() {
    createServer({
        routes() {
            //#region Variables
            const INVITATION = 'QwErTy58';

            const noCategoryAmount = 25;
            const list: ExerciseTree[] = [
                {
                    name: 'fizyka',
                    children: [
                        {
                            name: 'mechanika',
                            children: [
                                {
                                    name: 'kinematyka',
                                    children: [
                                        {
                                            type: 'EqEx',
                                            name: 'Pociągi dwa',
                                            children: 'pociagi-dwa',
                                            desc: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?'
                                        },
                                        {
                                            type: 'EqEx',
                                            name: 'Pociągi dwa 2',
                                            children: 'pociagi-dwa-2',
                                            desc: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?'
                                        }
                                    ]
                                },
                                {
                                    name: 'grawitacja',
                                    children: [
                                        {
                                            type: 'EqEx',
                                            name: 'Pociągi dwa',
                                            children: 'pociagi-dwa',
                                            desc: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?'
                                        },
                                        {
                                            type: 'EqEx',
                                            name: 'Pociągi dwa 2',
                                            children: 'pociagi-dwa-2',
                                            desc: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            name: 'fizyka atomowa',
                            children: [
                                {
                                    name: 'rozpad',
                                    children: [
                                        {
                                            type: 'EqEx',
                                            name: 'atom',
                                            children: 'atom',
                                            desc: 'Atom ma bardzo krótkie polecenie. Podaj \\(T\\).'
                                        },
                                        {
                                            type: 'EqEx',
                                            name: 'error 404',
                                            children: 'error-404',
                                            desc: 'Error 404'
                                        },
                                        {
                                            type: 'EqEx',
                                            name: 'error 400',
                                            children: 'error-400',
                                            desc: 'Error 400'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    name: 'astronomia',
                    children: [
                        {
                            type: 'EqEx',
                            name: 'Kąt',
                            children: 'angle',
                            desc: 'Człowiek pracujący w polu w punkcie \\(A\\) zobaczył idącego szosą sąsiada w punkcie \\(B\\).\nRuszył mu na spotkanie idąc do punktu \\(C\\) szosy z prędkością \\(v_1=5.4\\mathrm{\\frac{m}{s}}\\).\nZ jaką prędkością szedł sąsiad, jeżeli obydwaj doszli do punktu \\(C\\) jednocześnie?\nKąt \\(\\alpha=36°\\), a \\(\\beta=59°\\).'
                        }
                    ]
                }
            ];
            for (let i = 0; i < noCategoryAmount; i++) {
                if (typeof list[0].children !== 'string') {
                    list[0].children.push({
                        type: 'EqEx',
                        name: 'no category',
                        children: `no-category-${i}`,
                        desc: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?'
                    });
                }
            }

            const subjects = [
                'fizyka',
                '_fizyka',
                'astronomia',
                '_zzz',
                'zz',
                'zzz'
            ];

            const teamAmount = 20;
            const teams: Team[] = [
                {
                    id: 1,
                    name: 'Teachers',
                    assignee: 'root',
                    invitation: null
                }
            ];
            for (let i = 0; i < teamAmount; i++) {
                teams.push({
                    id: i + 2,
                    name: `${i + 1}d`,
                    assignee: `User${i}`,
                    invitation: i % 2 === 0 ? INVITATION : null
                });
            }

            const userAmount = teamAmount + 5;
            const users: User[] = [];
            for (let i = 0; i < userAmount; i++) {
                users.push({
                    id: `u${i}`,
                    name: `User${i}`,
                    number: i % 2 === 0 ? i + 1 : null
                });
            }
            //#endregion

            //#region Exercises
            this.post('/api/exercise/list', (_schema: any, request: any) => {
                const id = JSON.parse(request.requestBody).id;
                if (typeof id !== 'string' || id.includes('zz'))
                    return new Response(404);
                return (
                    (id.includes('fizyka')
                        ? list[0].children
                        : list[1].children) as ExerciseTree[]
                ).map((node) => ({
                    name: node.name,
                    children: node.children,
                    done: node.done
                }));
            });
            this.post('/api/exercise/render', (_schema: any, request: any) => {
                const attrs = JSON.parse(request.requestBody);
                const subject = /([^/]+)\//g.exec(attrs.id)?.[1];
                const exercise = /\/([^/]+)/g.exec(attrs.id)?.[1];
                switch (subject) {
                    case 'fizyka': {
                        if (exercise?.includes('no-category')) {
                            return {
                                type: 'EqEx',
                                name: 'Bez kategorii',
                                content: {
                                    main: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
                                    img: [
                                        'https://bulma.io/images/placeholders/720x240.png',
                                        'https://bulma.io/images/placeholders/640x480.png',
                                        'https://bulma.io/images/placeholders/240x720.png'
                                    ],
                                    unknowns: [
                                        ['x', '\\mathrm{km}'],
                                        ['F', '\\mathrm{N}'],
                                        ['t', '\\mathrm{s}']
                                    ]
                                }
                            };
                        }
                        let name;
                        switch (exercise) {
                            case 'pociagi-dwa':
                                name = 'Pociągi dwa';
                                break;
                            case 'pociagi-dwa-2':
                                name = 'Pociągi dwa 2';
                                break;
                            case 'atom':
                                return {
                                    type: 'EqEx',
                                    name: 'Atom',
                                    content: {
                                        main: 'Atom ma bardzo krótkie polecenie. Podaj \\(T\\).',
                                        unknowns: [
                                            ['T', '\\mathrm{\\frac{1}{s}}']
                                        ]
                                    }
                                };
                            case 'error-400':
                                return {
                                    type: 'EqEx',
                                    name: 'Error',
                                    content: {
                                        main: 'Polecenie \\(abc\\)',
                                        unknowns: [
                                            [
                                                '\\omega',
                                                '\\mathrm{\\frac{2}{s^2}}'
                                            ]
                                        ],
                                        img: ['test.png']
                                    }
                                };
                            default:
                                return new Response(404);
                        }
                        return {
                            type: 'EqEx',
                            name,
                            content: {
                                main: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
                                img: [
                                    'https://bulma.io/images/placeholders/480x640.png'
                                ],
                                unknowns: [
                                    ['x', '\\mathrm{km}'],
                                    ['t', '\\mathrm{s}']
                                ]
                            }
                        };
                    }
                    case 'astronomia':
                        if (exercise === 'angle') {
                            return {
                                type: 'EqEx',
                                name: 'Kąt',
                                content: {
                                    main: 'Człowiek pracujący w polu w punkcie \\(A\\) zobaczył idącego szosą sąsiada w punkcie \\(B\\).\nRuszył mu na spotkanie idąc do punktu \\(C\\) szosy z prędkością \\(v_1=5.4\\mathrm{\\frac{m}{s}}\\).\nZ jaką prędkością szedł sąsiad, jeżeli obydwaj doszli do punktu \\(C\\) jednocześnie?\nKąt \\(\\alpha=36°\\), a \\(\\beta=59°\\).',
                                    img: [
                                        'https://bulma.io/images/placeholders/256x256.png'
                                    ],
                                    unknowns: [
                                        ['v_2', '\\mathrm{\\frac{m}{s}}']
                                    ]
                                }
                            };
                        }
                        return new Response(404);
                    default:
                        return new Response(404);
                }
            });
            this.post('/api/exercise/check', (_schema: any, request: any) => {
                const attrs = JSON.parse(request.requestBody);
                const exercise = /\/([^/]+)/g.exec(attrs.id)?.[1];
                if (exercise === 'error-400')
                    return new Response(attrs.answers[0] === 1 ? 404 : 400);

                const result: boolean[] = (attrs.answers as number[]).map(
                    (val, i) => val === Number((1.1 * (i + 1)).toFixed(1))
                );
                setDone(list, attrs.id, result, noCategoryAmount);
                return result;
            });
            //#endregion

            //#region Subject
            this.get('/api/subject/list', () => subjects);
            this.post(
                '/api/subject/exercise/list',
                (_schema: any, request: any) => {
                    if (!currentAccount) return new Response(500);
                    if (currentAccount.team > 1) return new Response(403);
                    const id = JSON.parse(request.requestBody).id;
                    const subject = list.find((tree) => tree.name === id);
                    if (subject) return subject.children as ExerciseTree[];
                    else return new Response(404);
                }
            );
            this.post(
                '/api/subject/exercise/get',
                (_schema: any, request: any) => {
                    if (!currentAccount) return new Response(500);
                    if (currentAccount.team > 1) return new Response(403);
                    const id = /\/(.+)/.exec(
                        JSON.parse(request.requestBody).id
                    );
                    if (!id || id.length < 2) return new Response(404);
                    const name =
                        id[1] === 'pociagi-dwa'
                            ? 'Pociągi dwa'
                            : (
                                  id[1].charAt(0).toUpperCase() +
                                  id[1].substring(1)
                              ).replace('-', ' ');
                    return {
                        content: `---\ntype: EqEx\nname: ${name}\n---\nZ miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n`
                    };
                }
            );
            this.post(
                '/api/subject/exercise/add',
                (_schema: any, request: any) => {
                    if (!currentAccount) return new Response(500);
                    if (currentAccount.team > 1) return new Response(403);
                    const content = JSON.parse(request.requestBody).content;
                    if (
                        typeof content === 'string' &&
                        content.toLowerCase().includes('name: error409')
                    )
                        return new Response(409);
                    return new Response(200);
                }
            );
            this.post(
                '/api/subject/exercise/update',
                (_schema: any, request: any) => {
                    if (!currentAccount) return new Response(500);
                    if (currentAccount.team > 1) return new Response(403);
                    const content = JSON.parse(request.requestBody).content;
                    if (
                        typeof content === 'string' &&
                        !content.toLowerCase().includes('name: pociagi-dwa')
                    )
                        return new Response(404);
                    return new Response(200);
                }
            );
            this.post(
                '/api/subject/exercise/preview',
                (_schema: any, request: any) => {
                    if (!currentAccount) return new Response(500);
                    if (currentAccount.team > 1) return new Response(403);
                    const attrs = JSON.parse(request.requestBody);
                    const regex = /name: (.+)\n---/i;
                    const nameArray = regex.exec(attrs.content as string);
                    if (
                        typeof attrs.content !== 'string' ||
                        !nameArray ||
                        nameArray.length < 2
                    )
                        return new Response(404);
                    const seed = typeof attrs.seed === 'number' ? attrs.seed as number + 1 : 1;
                    return {
                        type: 'EqEx',
                        name: nameArray[1],
                        content: {
                            main: 'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
                            // img: ['https://bulma.io/images/placeholders/480x640.png'],
                            unknowns: [
                                ['x', '\\mathrm{km}'],
                                ['t', '\\mathrm{s}']
                            ],
                            correct: [2.5 * seed, 125 * seed]
                        }
                    };
                }
            );
            //#endregion

            //#region Auth
            let currentAccount: Account | null = null;
            this.post('/api/auth/register', (_schema: any, request: any) => {
                const attrs = JSON.parse(request.requestBody);
                if (attrs.login === 'b@b.bb') return new Response(409);
                else if (attrs.invitation === 'b') return new Response(403);
                else if (attrs.number === 1) return new Response(404);
                else return new Response(200);
            });
            this.post('/api/auth/login', (_schema: any, request: any) => {
                const attrs = JSON.parse(request.requestBody);
                switch (attrs.login) {
                    case 'b@b.bb':
                        switch (attrs.hashedPassword) {
                            case 'ZywyW1h4EKLJe/jAjKiDN+eufwV0SOeTIjb2DBMgJqQ=': // Password 'b' hashed with email 'b@b.bb'
                                return new Response(401);
                            case 'xfDzQivyYi4/DyiVO/d+1DBbR6WXxBe2v2xGVx0k5Lw=': // Password '1' hashed with email 'b@b.bb'
                                return new Response(500);
                            default:
                                currentAccount = {
                                    name: 'User1',
                                    number: null,
                                    team: 1
                                };
                                return new Response(200);
                        }
                    case 'c@c.cc':
                        currentAccount = {
                            name: 'User0',
                            number: null,
                            team: 0
                        };
                        return new Response(200);
                    case 'root':
                        currentAccount = {
                            name: 'root',
                            number: null,
                            team: 0
                        };
                        return new Response(200);
                    case 'd@d.dd':
                        return new Response(200);
                    default:
                        currentAccount = {
                            name: `User${teamAmount}`,
                            number: 11,
                            team: 2
                        };
                        return new Response(200);
                }
            });
            this.post('/api/auth/logout', () => {
                if (currentAccount) {
                    if (currentAccount.name === 'UserB')
                        return new Response(400);
                    else return new Response(200);
                }
                else return new Response(500);
            });
            //#endregion

            //#region User
            this.get('/api/user/current', () => {
                if (currentAccount !== null) return currentAccount;
                else return new Response(400);
            });
            this.post('/api/user/delete', (_schema: any, request: any) => {
                if (!currentAccount) return new Response(500);
                if (currentAccount.team > 1) return new Response(403);
                const id = JSON.parse(request.requestBody).id;
                if (id === undefined) return new Response(400);
                const i = users.findIndex((val) => val.id === id);
                if (i === -1) return new Response(404);
                users.splice(i);
                return new Response(200);
            });
            this.post('/api/user/update', (_schema: any, request: any) => {
                if (!currentAccount) return new Response(500);
                if (currentAccount.team > 1) return new Response(403);

                const attrs = JSON.parse(request.requestBody);
                if (attrs.id === undefined) return new Response(400);
                const i = users.findIndex((val) => val.id === attrs.id);
                if (i === -1) return new Response(404);

                if (attrs.name) users[i].name = attrs.name;
                if (attrs.number !== undefined) users[i].number = attrs.number;
                return new Response(200);
            });
            this.post('/api/user/info', (_schema: any, request: any) => {
                if (!currentAccount) return new Response(500);
                if (currentAccount.team > 1) return new Response(403);
                const id = JSON.parse(request.requestBody).id;
                if (id === undefined) return new Response(400);
                const user = users.find((val) => val.id === id);
                if (!user) return new Response(404);
                return {
                    name: user.name,
                    team: 2,
                    number: user.number
                };
            });
            //#endregion

            //#region Team
            this.get('/api/team/list', () => {
                switch (currentAccount?.team) {
                    case 0:
                        return teams;
                    case 1:
                        return teams.map((val) => ({
                            id: val.id,
                            name: val.name,
                            assignee:
                                val.assignee === currentAccount?.name
                                    ? val.assignee
                                    : undefined,
                            invitation:
                                val.assignee === currentAccount?.name
                                    ? val.invitation
                                    : undefined
                        }));
                    default:
                        return new Response(403);
                }
            });
            this.post('/api/team/info', (_schema: any, request: any) => {
                const id = JSON.parse(request.requestBody).id;
                if (!currentAccount) return new Response(500);
                if (id !== undefined && id > 0 && id <= teams.length) {
                    const team = teams[id - 1];
                    const members = [];
                    for (let i = 5; i < users.length; i++)
                        members.push(users[i]);
                    return {
                        name: team.name,
                        assignee: team.assignee,
                        invitation:
                            currentAccount.team < 2
                                ? team.invitation
                                : undefined,
                        members: currentAccount.team < 2 ? members : undefined
                    };
                }
                else return new Response(404);
            });
            this.post('/api/team/update', (_schema: any, request: any) => {
                const attrs = JSON.parse(request.requestBody);
                if (!currentAccount) return new Response(500);
                if (
                    attrs.id !== undefined &&
                    attrs.id > 0 &&
                    attrs.id <= teams.length
                ) {
                    if (
                        currentAccount.team !== 0 &&
                        teams[attrs.id - 1].assignee !== currentAccount.name
                    )
                        return new Response(403);

                    const assignee = Number(
                        (attrs.assignee as string | undefined)?.substring(1)
                    );
                    if (
                        !isNaN(assignee) &&
                        assignee >= 0 &&
                        assignee < userAmount
                    )
                        teams[attrs.id - 1].assignee = users[assignee].name;
                    else return new Response(404);

                    if (attrs.name) teams[attrs.id - 1].name = attrs.name;

                    if (attrs.invitation !== undefined) {
                        if (
                            teams.find(
                                (val) =>
                                    val.invitation !== null &&
                                    val.invitation === attrs.invitation
                            )
                        )
                            return new Response(409);
                        teams[attrs.id - 1].invitation =
                            attrs.invitation !== ''
                                ? attrs.invitation
                                : INVITATION;
                    }

                    return new Response(200);
                }
                else return new Response(404);
            });
            this.post('/api/team/create', (_schema: any, request: any) => {
                if (!currentAccount) return new Response(500);
                if (currentAccount.team >= 2) return new Response(403);
                const name = JSON.parse(request.requestBody).name;
                if (!name || typeof name !== 'string') return new Response(400);
                const id = teams.length + 2;
                teams.push({
                    id,
                    name,
                    assignee: currentAccount.name,
                    invitation: null
                });
                return new Response(200, undefined, id);
            });
            this.post('/api/team/delete', (_schema: any, request: any) => {
                if (!currentAccount) return new Response(500);
                const id = JSON.parse(request.requestBody).id;
                if (id === undefined || typeof id !== 'number')
                    return new Response(400);
                if (id < 1 || id - 1 >= teams.length) return new Response(404);
                if (
                    id === 1 ||
                    (currentAccount.team !== 0 &&
                        teams[id - 1].assignee !== currentAccount.name)
                )
                    return new Response(403);
                teams.splice(id - 1);
                return new Response(200);
            });
            //#endregion

            //#region Passthrough
            [
                'https://bulma.io/images/placeholders/720x240.png',
                'https://bulma.io/images/placeholders/640x480.png',
                'https://bulma.io/images/placeholders/240x720.png',
                'https://bulma.io/images/placeholders/256x256.png'
            ].forEach((url) => {
                this.passthrough(url);
            });
            //#endregion
        }
    });
    console.log('server started');
}

function setDone(
    list: ExerciseTree[],
    url: string,
    result: boolean[],
    noCategoryAmount: number
) {
    let count = 0;
    result.forEach((val) => {
        if (val) count++;
    });
    const percent = Number(((count / result.length) * 100).toFixed(0));
    switch (url) {
        case 'fizyka/pociagi-dwa':
            (
                (
                    (
                        (list[0].children as ExerciseTree[])[0]
                            .children as ExerciseTree[]
                    )[0].children as ExerciseTree[]
                )[0] as any
            ).done = percent;
            (
                (
                    (
                        (list[0].children as ExerciseTree[])[0]
                            .children as ExerciseTree[]
                    )[1].children as ExerciseTree[]
                )[0] as any
            ).done = percent;
            break;
        case 'fizyka/pociagi-dwa-2':
            (
                (
                    (
                        (list[0].children as ExerciseTree[])[0]
                            .children as ExerciseTree[]
                    )[0].children as ExerciseTree[]
                )[1] as any
            ).done = percent;
            (
                (
                    (
                        (list[0].children as ExerciseTree[])[0]
                            .children as ExerciseTree[]
                    )[1].children as ExerciseTree[]
                )[1] as any
            ).done = percent;
            break;
        case 'fizyka/atom':
            (
                (
                    (
                        (list[0].children as ExerciseTree[])[1]
                            .children as ExerciseTree[]
                    )[0].children as ExerciseTree[]
                )[0] as any
            ).done = percent;
            break;
        case 'fizyka/no-category-0':
            ((list[0].children as ExerciseTree[])[2] as any).done = percent;
            break;
        case 'subject/angle':
            for (let i = 1; i <= noCategoryAmount; i++)
                ((list[i].children as ExerciseTree[])[0] as any).done = percent;
            break;
    }
}
