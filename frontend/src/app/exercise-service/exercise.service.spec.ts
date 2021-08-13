/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { Account, AccountService } from '../account/account.service';
import { Role, RoleGuardService } from '../guards/role-guard.service';
import { ExerciseService } from './exercise.service';
import {
  ExerciseTreeNode,
  ServerResponseNode,
  Subject,
} from './exercise.utils';
import * as ServerRoutes from '../server-routes';
import { TypeError } from '../helper/utils';
import { EqEx, Exercise } from './exercises';

describe('Service: Exercise', () => {
  let httpController: HttpTestingController;
  let accountService = {
    currentAccount: {
      getValue: jasmine.createSpy('getValue'),
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExerciseService,
        HttpClient,
        { provide: AccountService, useValue: accountService },
      ],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('getSubject', () => {
    let roleSpy: jasmine.Spy<(arg0: Account) => Role>;
    let subjectCreateSpy: jasmine.Spy<
      (
        serverResponse: ServerResponseNode,
        getLocalDone: boolean
      ) => ExerciseTreeNode | null
    >;
    let subjectValidSpy: jasmine.Spy<
      (object: any, root?: boolean) => object is ServerResponseNode
    >;
    const subjectId = 'Sb1';

    beforeEach(() => {
      roleSpy = spyOn(RoleGuardService, 'getRole');
      subjectCreateSpy = spyOn(Subject, 'createSubject');
      subjectValidSpy = spyOn(Subject, 'checkSubjectValidity');
    });

    it(
      'should throw error on fetching (Type Error)',
      waitForAsync(
        inject(
          [ExerciseService, HttpClient, AccountService],
          (service: ExerciseService) => {
            expect(service).toBeTruthy();
            accountService.currentAccount.getValue.and.returnValue(null);
            subjectValidSpy.and.returnValue(false);

            service
              .getExerciseTree(subjectId)
              .then(() => fail('should throw error'))
              .catch((error) => expect(error.status).toBe(TypeError));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('POST');
            req.flush({ name: subjectId });
          }
        )
      )
    );

    it(
      'should throw error on creating (Type Error)',
      waitForAsync(
        inject(
          [ExerciseService, HttpClient, AccountService],
          (service: ExerciseService) => {
            expect(service).toBeTruthy();
            accountService.currentAccount.getValue.and.returnValue(null);
            subjectCreateSpy.and.returnValue(null);
            subjectValidSpy.and.returnValue(true);

            service
              .getExerciseTree(subjectId)
              .then(() => fail('should throw error'))
              .catch((error) => expect(error.status).toBe(TypeError));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('POST');
            req.flush({});
          }
        )
      )
    );

    const list: [{} | null, Role][] = [
      [null, Role.ADMIN],
      [null, Role.USER],
      [{}, Role.ADMIN],
      [{}, Role.TEACHER],
      [{}, Role.USER],
    ];
    for (const [account, role] of list) {
      it(
        `should return Exercise tree (${account ? '' : 'Account null, '}${
          Role[role]
        } role)`,
        waitForAsync(
          inject([ExerciseService, HttpClient], (service: ExerciseService) => {
            expect(service).toBeTruthy();
            //#region Mocks
            roleSpy.and.returnValue(role);
            subjectValidSpy.and.returnValue(true);
            subjectCreateSpy.and.callFake(
              (object) => object as unknown as ExerciseTreeNode
            );
            const getDone = role === Role.USER || account === null;
            const subject = {
              name: 'Sb1',
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
                          done: getDone ? 0.34 : undefined,
                        },
                      ],
                    },
                  ],
                },
              ],
            };
            //#endregion

            service
              .getExerciseTree('Sb1')
              .then((response) =>
                expect(response).toEqual(subject as unknown as ExerciseTreeNode)
              )
              .catch(() => fail('should resolve'));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('POST');
            req.flush(subject.children);
          })
        )
      );
    }
  });

  describe('getExercise', () => {
    //TODO Tests w/ seed
    const exerciseContent = {
      main: 'Test content',
      img: ['1.png', '2.png'],
      unknowns: [
        ['x', '\\mathrm{km}'],
        ['t', '\\mathrm{s}'],
      ],
    };

    it(
      'should throw server error',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();
          const errorCode = 500;

          service
            .getExercise('Sb1', 'ex1')
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(errorCode));
          const req = httpController.expectOne(ServerRoutes.exerciseRender);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb1/ex1', seed: undefined });
          req.error(new ErrorEvent('Server error'), { status: errorCode });
        })
      )
    );

    it(
      'should throw TypeError',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();

          service
            .getExercise('Sb2', 'ex2')
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(TypeError));
          const req = httpController.expectOne(ServerRoutes.exerciseRender);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb2/ex2', seed: undefined });
          req.flush({ type: 'EqEx', name: 'Ex2' });
        })
      )
    );

    it(
      'should return Exercise',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();
          const exercise: Exercise = {
            id: 'ex3',
            subjectId: 'Sb3',
            type: 'EqEx',
            name: 'Ex3',
            content: exerciseContent,
            done: 0.14,
          };

          service
            .getExercise('Sb3', 'ex3')
            .then((response) => expect(response).toEqual(exercise))
            .catch(() => fail('should resolve'));
          const req = httpController.expectOne(ServerRoutes.exerciseRender);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb3/ex3', seed: undefined });
          req.flush(exercise);
        })
      )
    );

    it(
      'should return Exercise (w/ done from local storage)',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();
          const id = 'ex4';
          const subjectId = 'Sb4';
          const type = 'EqEx';
          const name = 'Ex4';
          const done = 0.14;
          spyOn(Object.getPrototypeOf(localStorage), 'getItem').and.returnValue(
            done.toString()
          );

          service
            .getExercise(subjectId, id)
            .then((response) =>
              expect(response).toEqual({
                id,
                subjectId,
                type,
                name,
                content: exerciseContent,
                done,
              })
            )
            .catch(() => fail('should resolve'));
          const req = httpController.expectOne(ServerRoutes.exerciseRender);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({
            id: `${subjectId}/${id}`,
            seed: undefined,
          });
          req.flush({ id, subjectId, type, name, content: exerciseContent });
        })
      )
    );
  });

  describe('submitAnswers', () => {
    const answers: number[] = [0.14, 0.5, 1];
    const typeChecker = (
      obj: any,
      arg1: boolean,
      arg2: boolean
    ): obj is number[] => arg1 || arg2;

    it(
      'should return result',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();
          const result = answers.map((_, i) => i % 2 === 0);

          service
            .submitAnswers(
              'Sb1',
              'ex1',
              answers,
              EqEx.isEqExAnswer,
              answers.length
            )
            .then((response) => expect(response).toEqual(result))
            .catch(() => fail('should resolve'));
          const req = httpController.expectOne(ServerRoutes.exerciseCheck);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb1/ex1', answers });
          req.flush(result);
        })
      )
    );

    it(
      'should return result (more type checker args)',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();

          service
            .submitAnswers('Sb2', 'ex2', answers, typeChecker, false, true)
            .then((response) => expect(response).toBe(answers))
            .catch(() => fail('should be resolved'));
          const req = httpController.expectOne(ServerRoutes.exerciseCheck);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb2/ex2', answers });
          req.flush(answers);
        })
      )
    );

    it(
      'should throw error',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();
          const errorCode = 404;

          service
            .submitAnswers('Sb3', 'ex3', answers, typeChecker, false, true)
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(errorCode));
          const req = httpController.expectOne(ServerRoutes.exerciseCheck);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb3/ex3', answers });
          req.error(new ErrorEvent('Not found'), { status: errorCode });
        })
      )
    );

    it(
      'should throw Type Error',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();

          service
            .submitAnswers('Sb4', 'ex4', answers, typeChecker, false, false)
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(TypeError));
          const req = httpController.expectOne(ServerRoutes.exerciseCheck);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb4/ex4', answers });
          req.flush(answers);
        })
      )
    );
  });
});
