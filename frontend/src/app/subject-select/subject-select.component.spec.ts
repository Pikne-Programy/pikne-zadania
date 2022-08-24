import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { setAsyncTimeout } from '../helper/tests/tests.utils';
import {
    Subject,
    SubjectService
} from '../subjects/subject.service/subject.service';

import { SubjectSelectComponent } from './subject-select.component';

describe('SubjectSelectComponent', () => {
    let component: SubjectSelectComponent;
    let fixture: ComponentFixture<SubjectSelectComponent>;
    const subjectServiceMock = {
        getSubjects: () => Promise.resolve([])
    };
    const routerMock = {
        navigate: (_: any[]) => Promise.resolve(true)
    };
    const routeMock = {
        path: '/test/path'
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SubjectSelectComponent],
            providers: [
                { provide: SubjectService, useValue: subjectServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ActivatedRoute, useValue: routeMock }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SubjectSelectComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', inject(
        [SubjectService, Router, ActivatedRoute],
        async (service: SubjectService, router: Router) => {
            //#region Test setup
            const returnList: Subject[] = [];
            for (let i = 0; i < 5; i++) returnList.push(new Subject(`sb${i}`));
            spyOn(service, 'getSubjects').and.resolveTo(returnList);
            const routerSpy = spyOn(router, 'navigate');
            component.ngAfterContentInit();
            await setAsyncTimeout(100);
            //#endregion
            expect(component).toBeTruthy();

            expect(component.list).toEqual(returnList);
            expect(routerSpy).not.toHaveBeenCalled();
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create & navigate to only Subject in list', inject(
        [SubjectService, Router, ActivatedRoute],
        async (
            service: SubjectService,
            router: Router,
            route: ActivatedRoute
        ) => {
            //#region Test setup
            const subjectId = 'sb1';
            const returnList = [new Subject(subjectId)];
            spyOn(service, 'getSubjects').and.resolveTo(returnList);
            const routerSpy = spyOn(router, 'navigate');
            component.ngAfterContentInit();
            await setAsyncTimeout(100);
            //#endregion
            expect(component).toBeTruthy();

            expect(component.list).toEqual(returnList);
            expect(routerSpy).toHaveBeenCalledWith(['subjects', subjectId], {
                relativeTo: route,
                queryParams: { isSingleSubject: true },
                skipLocationChange: true
            });
            expect(component.isLoading).toBeFalse();
        }
    ));

    it('should create w/ error', inject(
        [SubjectService, Router, ActivatedRoute],
        async (service: SubjectService, router: Router) => {
            //#region Test setup
            const errorCode = 500;
            spyOn(service, 'getSubjects').and.rejectWith({ status: errorCode });
            const routerSpy = spyOn(router, 'navigate');
            component.ngAfterContentInit();
            await setAsyncTimeout(100);
            //#endregion
            expect(component).toBeTruthy();

            expect(component.list.length).toBe(0);
            expect(routerSpy).not.toHaveBeenCalled();
            expect(component.errorCode).toBe(errorCode);
            expect(component.isLoading).toBeFalse();
        }
    ));

    describe('getSubjectList', () => {
        it('should map Subject list to SpecialPanelItemList', () => {
            //#region Test setup
            const list: Subject[] = [];
            for (let i = 0; i < 5; i++) list.push(new Subject(`sb${i}`));
            component.list = list;
            fixture.detectChanges();
            //#endregion
            expect(component).toBeTruthy();

            expect(component.getSubjectList()).toEqual(
                list.map((sb) => [
                    sb.getName(),
                    sb.id,
                    'fa-book',
                    false,
                    sb.isPrivate
                ])
            );
        });
    });
});
