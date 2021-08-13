/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import {
  Exercise as PreviewExercise,
  exerciseTypes,
} from 'src/app/exercise-service/exercises';
import { TypeError } from 'src/app/helper/utils';
import {
  Exercise,
  ExerciseModificationService as ModificationService,
} from './exercise-modification.service';
import * as ServerRoutes from 'src/app/server-routes';

describe('Service: ExerciseModification', () => {
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ModificationService, HttpClient],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Exercise', () => {
    const content =
      'Z miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n';
    const apiContent = `---\ntype: EqEx\nname: Pociągi dwa\n---\n${content}`;

    describe('createInstance', () => {
      it('create instance of Exercise', () => {
        try {
          const exercise = Exercise.createInstance(apiContent);
          expect(exercise).toBeInstanceOf(Exercise);
          expect(exercise.type).toBe('EqEx');
          expect(exercise.name).toBe('Pociągi dwa');
          expect(exercise.content).toBe(content);
        } catch (_) {
          fail('should create proper Exercise instance');
        }
      });

      it('should throw error (wrong header)', () => {
        try {
          Exercise.createInstance(content);
          fail('should throw error');
        } catch (error) {
          expect(error.message).toBe('Wrong exercise header');
        }
      });

      it('should throw error (type not found)', () => {
        spyOn(Exercise as any, 'getHeader').and.returnValue(
          'I am a trashy header'
        );

        try {
          Exercise.createInstance(content);
          fail('should throw error');
        } catch (error) {
          expect(error.message).toBe('Exercise type not found');
        }
      });

      it('should throw error (name not found)', () => {
        spyOn(Exercise as any, 'getHeader').and.returnValue(
          'I am a trashy header'
        );
        spyOn(Exercise as any, 'getType').and.returnValue('I am a trashy type');

        try {
          Exercise.createInstance(content);
          fail('should throw error');
        } catch (error) {
          expect(error.message).toBe('Exercise name not found');
        }
      });
    });

    describe('toString', () => {
      it('should use existing Exercise type', () => {
        const name = 'Ex1';
        const resultList = exerciseTypes.map((type) =>
          getToStringResult(type, name, content)
        );

        const list = ['EqEx', 'EQEX', 'eqex'];
        for (const type of list) {
          const exercise = new Exercise(type, name, content);
          expect(resultList)
            .withContext('Wrong conversion result')
            .toContain(exercise.toString());
        }
      });

      it('should use provided Exercise type', () => {
        const name = 'Ex2';
        const type = 'I am a trashy type';

        const exercise = new Exercise(type, name, content);
        expect(exercise.toString()).toBe(
          getToStringResult(type, name, content)
        );
      });
    });

    describe('generateId', () => {
      const list: [string, string][] = [
        ['Pociągi dwa', 'pociagi-dwa'],
        ['pociagi-dwa', 'pociagi-dwa'],
        [`póĆíägî\u00a0\u00a0ĐwÃ`, 'pociagi--%C4%91wa'],
      ];

      it('should generate id from Exercise instance', () => {
        for (const [name, result] of list) {
          const exercise = new Exercise('EqEx', name);
          expect(exercise.generateId())
            .withContext(`Expected '${name}' to be '${result}'`)
            .toBe(result);
        }
      });

      it('should generate id from string', () => {
        for (const [name, result] of list) {
          expect(Exercise.generateId(name))
            .withContext(`Expected '${name}' to be '${result}'`)
            .toBe(result);
        }
      });
    });
  });

  describe('getAllExercises', () => {
    const subjectId = 'Sb1';

    const list: [string, number, any][] = [
      ['server error', 500, {}],
      ['Not Found error', 404, {}],
      ['Type error', TypeError, [{ name: 'Trash :P' }]],
    ];
    for (const [testMess, errorCode, serverResponse] of list) {
      it(
        `should throw ${testMess}`,
        waitForAsync(
          inject(
            [ModificationService, HttpClient],
            (service: ModificationService) => {
              expect(service).toBeTruthy();

              service
                .getAllExercises(subjectId)
                .then(() => fail('should be rejected'))
                .catch((error) => expect(error.status).toBe(errorCode));
              const req = httpController.expectOne(
                ServerRoutes.subjectExerciseList
              );
              expect(req.request.method).toEqual('POST');
              expect(req.request.body).toEqual({ id: subjectId });
              if (errorCode !== TypeError)
                req.error(new ErrorEvent(testMess), { status: errorCode });
              else req.flush(serverResponse);
            }
          )
        )
      );
    }

    it('should return Set of all Exercise ids', inject(
      [ModificationService, HttpClient],
      (service: ModificationService) => {
        expect(service).toBeTruthy();
        //#region Mock objects
        const resultSet = new Set(['pociagi-dwa', 'kat', 'atom', 'spotkanie']);
        const serverResponse = [
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
                    name: 'Spotkanie',
                    children: 'spotkanie',
                  },
                ],
              },
              {
                name: 'Kąt',
                children: 'kat',
              },
            ],
          },
          {
            name: 'Atom',
            children: 'atom',
          },
        ];
        //#endregion

        service
          .getAllExercises(subjectId)
          .then((response) => expect(response).toEqual(resultSet))
          .catch(() => fail('should be resolved'));
        const req = httpController.expectOne(ServerRoutes.subjectExerciseList);
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual({ id: subjectId });
        req.flush(serverResponse);
      }
    ));
  });

  describe('getExercise', () => {
    const id = 'ex1';
    const subjectId = 'Sb1';

    const list: [string, number, any][] = [
      ['server error', 500, {}],
      ['Not Found error', 404, {}],
      ['Type error (wrong server response)', TypeError, [{ content: 123 }]],
      [
        'Type error (Exercise instance creation)',
        TypeError,
        [{ content: 'abc' }],
      ],
    ];
    for (const [testMess, errorCode, serverResponse] of list) {
      it(
        `should throw ${testMess}`,
        waitForAsync(
          inject(
            [ModificationService, HttpClient],
            (service: ModificationService) => {
              expect(service).toBeTruthy();

              service
                .getExercise(subjectId, id)
                .then(() => fail('should be rejected'))
                .catch((error) => expect(error.status).toBe(errorCode));
              const req = httpController.expectOne(
                ServerRoutes.subjectExerciseGet
              );
              expect(req.request.method).toEqual('POST');
              expect(req.request.body).toEqual({ id: `${subjectId}/${id}` });
              if (errorCode !== TypeError)
                req.error(new ErrorEvent(testMess), { status: errorCode });
              else req.flush(serverResponse);
            }
          )
        )
      );
    }

    it(
      'should return Exercise',
      waitForAsync(
        inject(
          [ModificationService, HttpClient],
          (service: ModificationService) => {
            expect(service).toBeTruthy();
            const content =
              'Z miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n';
            const serverResponse = {
              content: `---\ntype: EqEx\nname: Pociągi dwa\n---\n${content}`,
            };

            service
              .getExercise(subjectId, id)
              .then((response) => {
                expect(response).toBeInstanceOf(Exercise);
                expect(response.type).toBe('EqEx');
                expect(response.name).toBe('Pociągi dwa');
                expect(response.content).toBe(content);
              })
              .catch(() => fail('should be resolved'));
            const req = httpController.expectOne(
              ServerRoutes.subjectExerciseGet
            );
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toEqual({ id: `${subjectId}/${id}` });
            req.flush(serverResponse);
          }
        )
      )
    );
  });

  describe('addExercise', () => {
    expectSendExerciseRequest(ServerRoutes.subjectExerciseAdd, 'ex1', 'Ex1', [
      ['throw error (id already exists)', 409],
    ]);
  });

  describe('updateExercise', () => {
    expectSendExerciseRequest(
      ServerRoutes.subjectExerciseUpdate,
      'ex2',
      'Ex2',
      [['throw error (not found)', 404]]
    );
  });

  describe('getExercisePreview', () => {
    const exercise = new Exercise('EqEx', 'Ex1', 'Test content');
    const stringifiedExercise = {
      content: getToStringResult(
        exercise.type,
        exercise.name,
        exercise.content
      ),
      seed: undefined,
    };

    //TODO Tests w/ seed
    it(
      'should throw server error',
      waitForAsync(
        inject(
          [ModificationService, HttpClient],
          (service: ModificationService) => {
            expect(service).toBeTruthy();
            const errorCode = 500;

            service
              .getExercisePreview(exercise)
              .then(() => fail('should be rejected'))
              .catch((error) => expect(error.status).toBe(errorCode));
            const req = httpController.expectOne(
              ServerRoutes.subjectExercisePreview
            );
            expect(req.request.method).toEqual('POST');
            req.error(new ErrorEvent('Server error'), { status: errorCode });
          }
        )
      )
    );

    it(
      'should throw Type error',
      waitForAsync(
        inject(
          [ModificationService, HttpClient],
          (service: ModificationService) => {
            expect(service).toBeTruthy();

            service
              .getExercisePreview(exercise)
              .then(() => fail('should be rejected'))
              .catch((error) => expect(error.status).toBe(TypeError));
            const req = httpController.expectOne(
              ServerRoutes.subjectExercisePreview
            );
            expect(req.request.method).toEqual('POST');
            expect(req.request.body).toEqual(stringifiedExercise);
            req.flush({ abc: 'I am trash :P' });
          }
        )
      )
    );

    it('should return preview', inject(
      [ModificationService, HttpClient],
      (service: ModificationService) => {
        expect(service).toBeTruthy();
        const result: PreviewExercise = {
          id: '',
          subjectId: '',
          type: 'EqEx',
          name: 'Ex1',
          content: {},
        };

        service
          .getExercisePreview(exercise)
          .then((response) => expect(response).toEqual(result))
          .catch(() => fail('should resolve'));
        const req = httpController.expectOne(
          ServerRoutes.subjectExercisePreview
        );
        expect(req.request.method).toEqual('POST');
        expect(req.request.body).toEqual(stringifiedExercise);
        req.flush(result);
      }
    ));
  });

  function expectSendExerciseRequest(
    url: string,
    id: string,
    name: string,
    specialCases: [string, number | null][]
  ) {
    ServerRoutes.subjectExerciseAdd;
    const exercise = new Exercise('EqEx', name, 'Test content\n');
    const subjectId = 'Sb1';
    const result = `---\ntype: EqEx\nname: ${name}\n---\nTest content\n`;

    const list: [string, number | null][] = [
      ['resolve', null],
      ['throw server error', 500],
    ];
    for (const [testMess, errorCode] of list.concat(specialCases)) {
      it(
        `should ${testMess}`,
        waitForAsync(
          inject(
            [ModificationService, HttpClient],
            (service: ModificationService) => {
              expect(service).toBeTruthy();

              const promise =
                url === ServerRoutes.subjectExerciseAdd
                  ? service.addExercise(subjectId, exercise)
                  : service.updateExercise(subjectId, id, exercise);
              promise
                .then(() => {
                  if (errorCode !== null) fail('should be rejected');
                })
                .catch((error) => {
                  if (errorCode !== null) expect(error.status).toBe(errorCode);
                  else fail('should be resolved');
                });
              const req = httpController.expectOne(url);
              expect(req.request.method).toEqual('POST');
              expect(req.request.body).toEqual({
                id: `${subjectId}/${id}`,
                content: result,
              });
              if (errorCode === null) req.flush({});
              else req.error(new ErrorEvent(testMess), { status: errorCode });
            }
          )
        )
      );
    }
  }
});

function getToStringResult(type: string, name: string, content: string) {
  return `---\ntype: ${type}\nname: ${name}\n---\n${content}`;
}
