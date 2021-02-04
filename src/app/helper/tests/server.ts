import { createServer } from 'miragejs';

export function startServer() {
  createServer({
    routes() {
      this.get('/api/public', () => {
        interface ExerciseTree {
          name: string;
          children: ExerciseTree[] | string;
        }

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
                        children: 'pociągi-dwa',
                      },
                      {
                        name: 'Pociągi dwa 2',
                        children: 'pociągi-dwa-2',
                      },
                    ],
                  },
                  {
                    name: 'grawitacja',
                    children: [
                      {
                        name: 'Pociągi trzy',
                        children: 'pociągi-trzy',
                      },
                      {
                        name: 'Pociągi trzy 2',
                        children: 'pociągi-trzy-2',
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
                    ],
                  },
                ],
              },
            ],
          },
        ];

        for (let i = 0; i < 25; i++)
          if (typeof list[0].children !== 'string')
            list[0].children.push({
              name: 'no category',
              children: 'no-category',
            });
        for (let i = 0; i < 25; i++)
          list.push({
            name: 'subject',
            children: [
              {
                name: 'Kąt',
                children: 'angle',
              },
            ],
          });

        return list;
      });
      [
        'pociągi-dwa',
        'pociągi-dwa-2',
        'pociągi-trzy',
        'pociągi-trzy-2',
      ].forEach((url) => {
        this.get('api/public/fizyka/' + url, () => {
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
          return {
            type: 'EqEx',
            name: name,
            content: {
              main:
                'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
              imgs: ['https://bulma.io/images/placeholders/480x640.png'],
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
      this.get('api/public/fizyka/no-category', () => {
        return {
          type: 'EqEx',
          name: 'Bez kategorii',
          content: {
            main:
              'Z miast A i B odległych o \\(d=300\\mathrm{km}\\) wyruszają jednocześnie dwa pociągi z prędkościami \\(v_a=50\\mathrm{\\frac{m}{s}}\\) oraz \\(v_b=67\\mathrm{\\frac{m}{s}}\\).\nW jakiej odległości \\(x\\) od miasta A spotkają się te pociągi? Po jakim czasie \\(t\\) się to stanie?',
            imgs: [
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
      this.get('api/public/subject/angle', () => {
        return {
          type: 'EqEx',
          name: 'Kąt',
          content: {
            main:
              'Człowiek pracujący w polu w punkcie \\(A\\) zobaczył idącego szosą sąsiada w punkcie \\(B\\).\nRuszył mu na spotkanie idąc do punktu \\(C\\) szosy z prędkością \\(v_1=5.4\\mathrm{\\frac{m}{s}}\\).\nZ jaką prędkością szedł sąsiad, jeżeli obydwaj doszli do punktu \\(C\\) jednocześnie?\nKąt \\(\\alpha=36°\\), a \\(\\beta=59°\\).',
            imgs: ['https://bulma.io/images/placeholders/256x256.png'],
            unknowns: [['v_2', '\\mathrm{\\frac{m}{s}}']],
          },
        };
      });
      [
        'fizyka/pociągi-dwa',
        'fizyka/pociągi-dwa-2',
        'fizyka/pociągi-trzy',
        'fizyka/pociągi-trzy-2',
        'fizyka/atom',
        'fizyka/no-category',
        'subject/angle',
      ].forEach((url) => {
        this.post('api/public/' + url, (schema: any, request: any) => {
          const attrs = JSON.parse(request.requestBody);
          const result: boolean[] = [];
          Object.keys(attrs).forEach((field, i) => {
            result.push(attrs[field] == Number((1.1 * (i + 1)).toFixed(1)));
          });
          return { success: result.every((e) => e) };
        });
      });
      [
        '/eqex/eqex.html',
        'https://bulma.io/images/placeholders/720x240.png',
        'https://bulma.io/images/placeholders/640x480.png',
        'https://bulma.io/images/placeholders/240x720.png',
        'https://bulma.io/images/placeholders/256x256.png',
      ].forEach((url) => {
        this.passthrough(url);
      });
    },
  });
  console.log('server started');
}
