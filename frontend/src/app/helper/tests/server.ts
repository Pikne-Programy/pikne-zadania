import { createServer, Response } from 'miragejs';
import { Account } from '../../account/account.service';

interface ExerciseTree {
  name: string;
  children: ExerciseTree[] | string;
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
              for (let i = 1; i <= noCategoryAmount; i++)
                ((list[0].children as ExerciseTree[])[i] as any)[
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
    },
  });
  console.log('server started');
}
