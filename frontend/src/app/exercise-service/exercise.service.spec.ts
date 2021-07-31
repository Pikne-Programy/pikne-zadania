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
import { ServerResponseNode, Subject } from './exercise.utils';
import * as ServerRoutes from '../server-routes';

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

  describe('getSubjectList', () => {
    let roleSpy: jasmine.Spy<(arg0: Account) => Role>;
    let subjectListSpy: jasmine.Spy<
      (arg0: ServerResponseNode[], arg1: boolean) => Subject[] | null
    >;
    let subjectValidSpy: jasmine.Spy<
      (list: any, root?: boolean) => list is ServerResponseNode[]
    >;

    beforeEach(() => {
      roleSpy = spyOn(RoleGuardService, 'getRole');
      subjectListSpy = spyOn(Subject, 'createSubjectList');
      subjectValidSpy = spyOn(Subject, 'checkSubjectListValidity');
    });

    it(
      'should throw error on creating (Length Error)',
      waitForAsync(
        inject(
          [ExerciseService, HttpClient, AccountService],
          (service: ExerciseService) => {
            expect(service).toBeTruthy();
            accountService.currentAccount.getValue.and.returnValue(null);
            subjectValidSpy.and.callThrough();

            service
              .getSubjectList()
              .then(() => fail('should throw error'))
              .catch((error) => expect(error.status).toBe(419));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('GET');
            req.flush([]);
          }
        )
      )
    );

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
              .getSubjectList()
              .then(() => fail('should throw error'))
              .catch((error) => expect(error.status).toBe(400));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('GET');
            req.flush([{}]);
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
            subjectListSpy.and.returnValue(null);
            subjectValidSpy.and.returnValue(true);

            service
              .getSubjectList()
              .then(() => fail('should throw error'))
              .catch((error) => expect(error.status).toBe(400));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('GET');
            req.flush([{}]);
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
        `should return Subject list (${account ? '' : 'Account null, '}${
          Role[role]
        } role)`,
        waitForAsync(
          inject([ExerciseService, HttpClient], (service: ExerciseService) => {
            expect(service).toBeTruthy();
            //#region Mocks
            roleSpy.and.returnValue(role);
            subjectValidSpy.and.returnValue(true);
            subjectListSpy.and.callFake((list) => list as unknown as Subject[]);
            const getDone = role === Role.USER || account === null;
            const nodeList = [
              {
                name: 'Sb1',
                getDone,
              },
              {
                name: 'Sb2',
                getDone,
              },
              {
                name: 'Sb3',
                getDone,
              },
            ];
            //#endregion

            service
              .getSubjectList()
              .then((response) =>
                expect(response).toEqual(nodeList as unknown as Subject[])
              )
              .catch(() => fail('should resolve'));
            const req = httpController.expectOne(ServerRoutes.exerciseList);
            expect(req.request.method).toEqual('GET');
            req.flush(nodeList);
          })
        )
      );
    }
  });

  describe('findSubjectById', () => {
    const subjectList = [{ name: 'Sb1' }, { name: 'Sb2' }] as Subject[];

    it('should find subject', inject(
      [ExerciseService],
      (service: ExerciseService) => {
        expect(service).toBeTruthy();

        expect(service.findSubjectById('Sb1', subjectList)).toEqual({
          name: 'Sb1',
        } as Subject);
      }
    ));

    it('should return null (no Subject found)', inject(
      [ExerciseService],
      (service: ExerciseService) => {
        expect(service).toBeTruthy();

        expect(service.findSubjectById('Sb3', subjectList)).toBeNull();
      }
    ));
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
          const errorCode = 400;

          service
            .getExercise('Sb2', 'ex2')
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(errorCode));
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
          const exercise = {
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
          const type = 'EqEx';
          const name = 'Ex4';
          const done = 0.14;
          spyOn(Object.getPrototypeOf(localStorage), 'getItem').and.returnValue(
            done.toString()
          );

          service
            .getExercise('Sb4', 'ex4')
            .then((response) =>
              expect(response).toEqual({
                type,
                name,
                content: exerciseContent,
                done,
              })
            )
            .catch(() => fail('should resolve'));
          const req = httpController.expectOne(ServerRoutes.exerciseRender);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb4/ex4', seed: undefined });
          req.flush({ type, name, content: exerciseContent });
        })
      )
    );
  });

  describe('submitAnswers', () => {
    const answers: number[] = [0.14, 0.5, 1];

    it(
      'should return result',
      waitForAsync(
        inject([ExerciseService, HttpClient], (service: ExerciseService) => {
          expect(service).toBeTruthy();

          service
            .submitAnswers('Sb1', 'ex1', answers)
            .then((response) => expect(response).toEqual(answers))
            .catch(() => fail('should resolve'));
          const req = httpController.expectOne(ServerRoutes.exerciseCheck);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb1/ex1', answers });
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
            .submitAnswers('Sb2', 'ex2', answers)
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(errorCode));
          const req = httpController.expectOne(ServerRoutes.exerciseCheck);
          expect(req.request.method).toEqual('POST');
          expect(req.request.body).toEqual({ id: 'Sb2/ex2', answers });
          req.error(new ErrorEvent('Not found'), { status: errorCode });
        })
      )
    );
  });
});
