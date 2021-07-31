/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { Subject, SubjectService } from './subject.service';
import * as ServerRoutes from 'src/app/server-routes';

describe('Service: Subject', () => {
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubjectService, HttpClient],
    });

    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpController.verify();
  });

  describe('Subject', () => {
    describe('isPrivate', () => {
      it('should be public Subject', () => {
        const sb = new Subject('Sb1');
        expect(sb.isPrivate).toBeFalse();
      });

      it('should be private Subject', () => {
        const sb = new Subject('_Sb1');
        expect(sb.isPrivate).toBeTrue();
      });
    });

    describe('getName', () => {
      it('should get name of public Subject', () => {
        const sb = new Subject('Sb1');
        expect(sb.getName()).toBe('Sb1');
      });

      it('should get name of private Subject', () => {
        const sb = new Subject('_Sb1');
        expect(sb.getName()).toBe('Sb1');
      });
    });
  });

  describe('fetchSubjects', () => {
    const list: [string, number, any][] = [
      ['server error', 500, {}],
      ['Type error - not an array', 400, 'I am a trash response :P'],
      ['Type error - mixed type array', 400, ['abc', 123, false]],
    ];
    for (const [testMess, errorCode, serverResponse] of list) {
      it(`should throw error (${testMess})`, inject(
        [SubjectService, HttpClient],
        (service: SubjectService) => {
          expect(service).toBeTruthy();

          service
            .fetchSubjects()
            .then(() => fail('should be rejected'))
            .catch((error) => expect(error.status).toBe(errorCode));
          const req = httpController.expectOne(ServerRoutes.subjectList);
          expect(req.request.method).toEqual('GET');
          if (errorCode === 500)
            req.error(new ErrorEvent('Server error'), { status: errorCode });
          else req.flush(serverResponse);
        }
      ));
    }

    it(
      'should return sorted Subject list',
      waitForAsync(
        inject([SubjectService, HttpClient], (service: SubjectService) => {
          expect(service).toBeTruthy();
          const list = ['Sb2', '_Sb2', 'Sb1', 'Sb4', '_Sb3', 'Sb3'];
          const expectedList = ['Sb1', 'Sb2', '_Sb2', 'Sb3', '_Sb3', 'Sb4'];

          service
            .fetchSubjects()
            .then((subjects) => {
              expect(subjects.length).toBe(expectedList.length);
              const ids = subjects.map((subject) => subject.id);
              for (let i = 0; i < expectedList.length; i++)
                expect(ids[i]).toBe(expectedList[i]);
            })
            .catch(() => fail('should resolve'));
          const req = httpController.expectOne(ServerRoutes.subjectList);
          expect(req.request.method).toEqual('GET');
          req.flush(list);
        })
      )
    );
  });
});
