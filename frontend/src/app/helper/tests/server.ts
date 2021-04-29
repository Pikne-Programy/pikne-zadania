import { createServer, Response } from 'miragejs';
import { Account } from '../../account/account.service';

interface ExerciseTree {
  name: string;
  children: ExerciseTree[] | string;
}

interface Team {
  id: number;
  name: string;
  assignee: string;
  open: boolean;
}

interface User {
  id: string;
  name: string;
  number?: number | null;
}

export function startServer() {
  createServer({
    routes() {
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
                      name: 'Pociągi dwa',
                      children: 'pociagi-dwa',
                    },
                    {
                      name: 'Pociągi dwa 2',
                      children: 'pociagi-dwa-2',
                    },
                  ],
                },
                {
                  name: 'grawitacja',
                  children: [
                    {
                      name: 'Pociągi dwa',
                      children: 'pociagi-dwa',
                    },
                    {
                      name: 'Pociągi dwa 2',
                      children: 'pociagi-dwa-2',
                    },
                  ],
                },
              ],
            },
            {
              name: 'fizyka atomowa',
              children: [
                {
                  name: 'rozpad',
                  children: [
                    {
                      name: 'atom',
                      children: 'atom',
                    },
                    {
                      name: 'error 404',
                      children: 'error-404',
                    },
                    {
                      name: 'error 400',
                      children: 'error-400',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];
      for (let i = 0; i < noCategoryAmount; i++)
        if (typeof list[0].children !== 'string')
          list[0].children.push({
            name: 'no category',
            children: `no-category-${i}`,
          });
      for (let i = 0; i < noCategoryAmount; i++)
        list.push({
          name: 'subject',
          children: [
            {
              name: 'Kąt',
              children: 'angle',
            },
          ],
        });

      this.get('/api/public', () => list);
      ['pociagi-dwa', 'pociagi-dwa-2'].forEach((url) => {
        this.get('api/public/fizyka/' + url, () => {
          let name;
          switch (url) {
            case 'pociagi-dwa-2':
              name = 'Pociągi dwa 2';
              break;
            default:
              name = 'Pociągi dwa';
          }
          return {
            type: 'EqEx',
            name: name,
            content: {
              main:
                'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
              img: ['https://bulma.io/images/placeholders/480x640.png'],
              unknowns: [
                ['x', '\\mathrm{km}'],
                ['t', '\\mathrm{s}'],
              ],
            },
          };
        });
      });
      this.get('api/public/fizyka/atom', () => {
        return {
          type: 'EqEx',
          name: 'Atom',
          content: {
            main: 'Atom ma bardzo krótkie polecenie. Podaj \\(T\\).',
            unknowns: [['T', '\\mathrm{\\frac{1}{s}}']],
          },
        };
      });
      for (let i = 0; i < noCategoryAmount; i++) {
        this.get(`/api/public/fizyka/no-category-${i}`, () => {
          return {
            type: 'EqEx',
            name: 'Bez kategorii',
            content: {
              main:
                'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
              img: [
                'https://bulma.io/images/placeholders/720x240.png',
                'https://bulma.io/images/placeholders/640x480.png',
                'https://bulma.io/images/placeholders/240x720.png',
              ],
              unknowns: [
                ['x', '\\mathrm{km}'],
                ['F', '\\mathrm{N}'],
                ['t', '\\mathrm{s}'],
              ],
            },
          };
        });
      }
      this.get('/api/public/subject/angle', () => {
        return {
          type: 'EqEx',
          name: 'Kąt',
          content: {
            main:
              'Człowiek pracujący w polu w punkcie \\(A\\) zobaczył idącego szosą sąsiada w punkcie \\(B\\).\nRuszył mu na spotkanie idąc do punktu \\(C\\) szosy z prędkością \\(v_1=5.4\\mathrm{\\frac{m}{s}}\\).\nZ jaką prędkością szedł sąsiad, jeżeli obydwaj doszli do punktu \\(C\\) jednocześnie?\nKąt \\(\\alpha=36°\\), a \\(\\beta=59°\\).',
            img: ['https://bulma.io/images/placeholders/256x256.png'],
            unknowns: [['v_2', '\\mathrm{\\frac{m}{s}}']],
          },
        };
      });
      const postList = [
        'fizyka/pociagi-dwa',
        'fizyka/pociagi-dwa-2',
        'fizyka/atom',
        'subject/angle',
      ];
      for (let i = 0; i < noCategoryAmount; i++)
        postList.push(`fizyka/no-category-${i}`);
      postList.forEach((url) => {
        this.post('/api/public/' + url, (schema: any, request: any) => {
          const attrs = JSON.parse(request.requestBody);
          const result: boolean[] = [];
          Object.keys(attrs).forEach((field, i) => {
            result.push(attrs[field] == Number((1.1 * (i + 1)).toFixed(1)));
          });

          var count = 0;
          result.forEach((val) => {
            if (val) count++;
          });
          const percent = Number(((count / result.length) * 100).toFixed(0));
          switch (url) {
            case 'fizyka/pociagi-dwa':
              ((((list[0].children as ExerciseTree[])[0]
                .children as ExerciseTree[])[0]
                .children as ExerciseTree[])[0] as any)['done'] = percent;
              ((((list[0].children as ExerciseTree[])[0]
                .children as ExerciseTree[])[1]
                .children as ExerciseTree[])[0] as any)['done'] = percent;
              break;
            case 'fizyka/pociagi-dwa-2':
              ((((list[0].children as ExerciseTree[])[0]
                .children as ExerciseTree[])[0]
                .children as ExerciseTree[])[1] as any)['done'] = percent;
              ((((list[0].children as ExerciseTree[])[0]
                .children as ExerciseTree[])[1]
                .children as ExerciseTree[])[1] as any)['done'] = percent;
              break;
            case 'fizyka/atom':
              ((((list[0].children as ExerciseTree[])[1]
                .children as ExerciseTree[])[0]
                .children as ExerciseTree[])[0] as any)['done'] = percent;
              break;
            case 'fizyka/no-category-0':
              ((list[0].children as ExerciseTree[])[2] as any)[
                'done'
              ] = percent;
              break;
            case 'subject/angle':
              for (let i = 1; i <= noCategoryAmount; i++)
                ((list[i].children as ExerciseTree[])[0] as any)[
                  'done'
                ] = percent;
              break;
          }

          return result;
        });
      });
      [
        'https://bulma.io/images/placeholders/720x240.png',
        'https://bulma.io/images/placeholders/640x480.png',
        'https://bulma.io/images/placeholders/240x720.png',
        'https://bulma.io/images/placeholders/256x256.png',
      ].forEach((url) => {
        this.passthrough(url);
      });

      this.get('/api/public/fizyka/error-404', () => {
        return new Response(404, undefined, {
          errors: ['Exercise does not exist'],
        });
      });

      this.get('/api/public/fizyka/error-400', () => {
        return {
          type: 'EqEx',
          name: 'Error',
          content: {
            main: 'Polecenie \\(abc\\)',
            unknowns: [['\\omega', '\\mathrm{\\frac{2}{s^2}}']],
            img: ['test.png'],
          },
        };
      });
      this.post('/api/public/fizyka/error-400', (schema: any, request: any) => {
        const attrs = JSON.parse(request.requestBody);
        if (attrs[0] == 1)
          return new Response(404, undefined, {
            errors: ['Exercise not found'],
          });
        else return new Response(400, undefined, { errors: ['Wrong JSON'] });
      });

      var currentAccount: Account | null = null;
      this.post('/api/register', (schema: any, request: any) => {
        const attrs = JSON.parse(request.requestBody);
        if (attrs.login === 'b@b.bb') return new Response(409);
        else if (attrs.invitation === 'b') return new Response(403);
        else if (attrs.number === 1) return new Response(404);
        else return new Response(200);
      });
      this.post('/api/login', (schema: any, request: any) => {
        const attrs = JSON.parse(request.requestBody);
        switch (attrs.login) {
          case 'b@b.bb':
            switch (attrs.hashed_password) {
              case 'ZywyW1h4EKLJe/jAjKiDN+eufwV0SOeTIjb2DBMgJqQ=': //Password 'b' hashed with email 'b@b.bb'
                return new Response(401);
              case 'xfDzQivyYi4/DyiVO/d+1DBbR6WXxBe2v2xGVx0k5Lw=': //Password '1' hashed with email 'b@b.bb'
                return new Response(500);
              default:
                currentAccount = { name: 'UserB', number: null, team: 1 };
                return new Response(200);
            }
          case 'c@c.cc':
            currentAccount = { name: 'UserC', number: null, team: 0 };
            return new Response(200);
          case 'root':
            currentAccount = { name: 'root', number: null, team: 0 };
            return new Response(200);
          case 'd@d.dd':
            return new Response(200);
          default:
            currentAccount = { name: 'UserA', number: 11, team: 2 };
            return new Response(200);
        }
      });
      this.post('/api/logout', () => {
        if (currentAccount) {
          if (currentAccount.name === 'UserB') return new Response(400);
          else return new Response(200);
        } else return new Response(500);
      });
      this.get('/api/account', () => {
        if (currentAccount !== null) return currentAccount;
        else return new Response(400);
      });

      const teams: Team[] = [
        {
          id: 1,
          name: 'Teachers',
          open: false,
          assignee: 'root',
        },
      ];
      for (let i = 0; i < 20; i++)
        teams.push({
          id: i + 2,
          name: `${i + 1}d`,
          open: i % 2 === 0,
          assignee: `User${i}`,
        });
      this.get('/api/teams', () => {
        switch (currentAccount?.team) {
          case 0:
            return teams;
          case 1:
            const list = teams.map((val) => {
              return { id: val.id, name: val.name, open: val.open };
            });
            list.shift();
            return list;
          default:
            return new Response(403);
        }
      });
      const users: User[] = [];
      for (let i = 0; i < 25; i++)
        users.push({
          id: `u${i}`,
          name: `User${i}`,
          number: i % 2 === 0 ? i + 1 : null,
        });
      teams.forEach((team) => {
        this.get(`/api/teams/${team.id}`, () => {
          return getTeam(
            currentAccount,
            team.name,
            team.assignee,
            team.open,
            users
          );
        });
        this.post(`/api/teams/${team.id}`, (schema: any, request: any) => {
          return changeTeamName(
            currentAccount,
            team.id,
            JSON.parse(request.requestBody),
            teams
          );
        });
        this.post(`/api/teams/${team.id}/open`, (schema: any, request: any) => {
          return openTeamRegistration(
            currentAccount,
            team.id,
            JSON.parse(request.requestBody),
            teams
          );
        });
        this.post(`/api/teams/${team.id}/close`, () => {
          return closeTeamRegistration(currentAccount, team.id, teams);
        });
        this.post(`/api/root/teams/${team.id}`, (schema: any, request: any) => {
          return changeTeamAssignee(
            currentAccount,
            team.id,
            JSON.parse(request.requestBody),
            teams,
            users
          );
        });
        users.forEach((user) => {
          this.post(
            `/api/teams/${team.id}/${user.id}`,
            (schema: any, request: any) => {
              return editUserNumber(
                currentAccount,
                team.id,
                user.id,
                JSON.parse(request.requestBody),
                teams,
                users
              );
            }
          );
          this.delete(`/api/teams/${team.id}/${user.id}`, () => {
            return removeUser(currentAccount, team.id, user.id, teams, users);
          });
        });
      });
      this.post('/api/teams', (schema: any, request: any) => {
        if (!currentAccount) return new Response(500);
        if (currentAccount.team < 2) {
          const newTeam = JSON.parse(request.requestBody).name;
          if (newTeam && typeof newTeam === 'string') {
            if (!isNaN(Number(newTeam)))
              return new Response(Number(newTeam), undefined, {
                errors: ['Custom error'],
              });

            const newId = teams[teams.length - 1].id + 1;
            teams.push({
              id: newId,
              name: newTeam,
              open: newId % 2 === 0,
              assignee: `User${teams.length}`,
            });
            this.get(`/api/teams/${newId}`, () => {
              return getTeam(
                currentAccount,
                newTeam,
                teams[teams.length - 1].assignee,
                newId % 2 === 0,
                users
              );
            });
            this.post(`/api/teams/${newId}`, (schema: any, request: any) => {
              return changeTeamName(
                currentAccount,
                newId,
                JSON.parse(request.requestBody),
                teams
              );
            });
            this.post(
              `/api/teams/${newId}/open`,
              (schema: any, request: any) => {
                return openTeamRegistration(
                  currentAccount,
                  newId,
                  request.requestBody,
                  teams
                );
              }
            );
            this.post(`/api/teams/${newId}/close`, () => {
              return closeTeamRegistration(currentAccount, newId, teams);
            });
            this.post(
              `/api/root/teams/${newId}`,
              (schema: any, request: any) => {
                return changeTeamAssignee(
                  currentAccount,
                  newId,
                  JSON.parse(request.requestBody),
                  teams,
                  users
                );
              }
            );
            users.forEach((user) => {
              this.post(
                `/api/teams/${newId}/${user.id}`,
                (schema: any, request: any) => {
                  return editUserNumber(
                    currentAccount,
                    newId,
                    user.id,
                    JSON.parse(request.requestBody),
                    teams,
                    users
                  );
                }
              );
              this.delete(`/api/teams/${newId}/${user.id}`, () => {
                return removeUser(currentAccount, newId, user.id, teams, users);
              });
            });
            return new Response(200, undefined, newId);
          } else
            return new Response(400, undefined, { errors: ['Wrong name'] });
        } else return new Response(403);
      });
    },
  });
  console.log('server started');
}

let invitation = 'QwErTy58';

function getTeam(
  account: Account | null,
  name: string,
  assignee: string | undefined,
  isOpen: boolean,
  users: User[]
) {
  if (!account) return new Response(500);
  else if (account.team < 2) {
    return {
      name: name,
      assignee: assignee,
      invitation: isOpen ? invitation : null,
      members: users,
    };
  } else return new Response(403);
}
function changeTeamName(
  account: Account | null,
  teamId: number,
  newName: string,
  teams: Team[]
) {
  if (!account) return new Response(500);
  if (account.team >= 2) return new Response(403);
  if (account.team === 0 && teamId > teams[teams.length - 1].id)
    return new Response(404);

  teams[teamId - 1].name = newName;
  return new Response(200);
}

function openTeamRegistration(
  account: Account | null,
  teamId: number,
  invCode: string | null,
  teams: Team[]
) {
  if (!account) return new Response(500);
  if (account.team >= 2) return new Response(403);
  if (account.team === 0 && teamId > teams[teams.length - 1].id)
    return new Response(404);

  if (invCode === '409') return new Response(409);
  invitation = invCode ?? 'QwErTy58';
  teams[teamId - 1].open = true;
  return new Response(200);
}

function closeTeamRegistration(
  account: Account | null,
  teamId: number,
  teams: Team[]
) {
  if (!account) return new Response(500);
  if (account.team >= 2) return new Response(403);
  if (account.team === 0 && teamId > teams[teams.length - 1].id)
    return new Response(404);

  teams[teamId - 1].open = false;
  return new Response(200);
}

function changeTeamAssignee(
  account: Account | null,
  teamId: number,
  newAssignee: string,
  teams: Team[],
  users: User[]
) {
  if (!account) return new Response(500);
  if (teamId < 2 || account.team >= 2) return new Response(403);
  if (account.team === 0 && teamId > teams[teams.length - 1].id)
    return new Response(404, undefined, { errors: ['Team not found'] });

  const user = users.find((val) => val.id === newAssignee);
  if (!user)
    return new Response(404, undefined, { errors: ['User not found'] });
  teams[teamId - 1].assignee = user.name;
  return new Response(200);
}

function editUserNumber(
  account: Account | null,
  teamId: number,
  userId: string,
  requestBody: any,
  teams: Team[],
  users: User[]
) {
  if (!account) return new Response(500);
  if (account.team >= 2) return new Response(403);
  if (teamId > teams[teams.length - 1].id)
    return new Response(404, undefined, { errors: ['Team not found'] });

  const i = Number(userId);
  if (isNaN(i) || i < 0 || i >= users.length)
    return new Response(404, undefined, { errors: ['User not found'] });
  const newNumber = requestBody;
  if (newNumber === null || !isNaN(Number(newNumber))) {
    users[i].number = newNumber === null ? null : Number(newNumber);
    return new Response(200);
  } else return new Response(400);
}

function removeUser(
  account: Account | null,
  teamId: number,
  userId: string,
  teams: Team[],
  users: User[]
) {
  if (!account) return new Response(500);
  if (account.team >= 2) return new Response(403);
  if (teamId > teams[teams.length - 1].id)
    return new Response(404, undefined, { errors: ['Team not found'] });

  const i = users.findIndex((val) => val.id === userId);
  if (i === -1)
    return new Response(404, undefined, { errors: ['User not found'] });
  users.splice(i, 1);
  return new Response(200);
}
