/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import {
    Account,
    AccountReturnType,
    AccountService
} from '../account/account.service';
import { setAsyncTimeout } from '../helper/tests/tests.utils';

import { NavComponent } from './nav.component';
import { NavService } from './services/navigation.service';

describe('NavComponent', () => {
    let component: NavComponent;
    let fixture: ComponentFixture<NavComponent>;
    const returnObj: AccountReturnType = {
        observable: { getValue: () => null }
    } as any;
    const accountServiceMock = {
        getAccount: () => Promise.resolve(returnObj)
    };
    const navServiceMock = {
        toggleSidenav: () => {}
    };
    let service: NavService;
    let localStorageMock: any = {};
    const cookiesKey = 'COOKIES_STATUS';

    beforeEach(() => {
        localStorageMock = {};

        spyOn(Object.getPrototypeOf(localStorage), 'getItem').and.callFake(
            (key: string) =>
                key in localStorageMock ? localStorageMock[key] : null
        );
        spyOn(Object.getPrototypeOf(localStorage), 'setItem').and.callFake(
            (key: string, value: string) => (localStorageMock[key] = value + '')
        );
        spyOn(Object.getPrototypeOf(localStorage), 'clear').and.callFake(
            () => (localStorageMock = {})
        );
    });

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [NavComponent],
            providers: [
                { provide: NavService, useValue: navServiceMock },
                { provide: AccountService, useValue: accountServiceMock }
            ]
        }).compileComponents();
    }));

    it('should create', () => {
        setupTest();

        expect(component).toBeTruthy();
    });

    it('should toggleSidenav', () => {
        setupTest();
        const spy = spyOn(service, 'toggleSidenav');
        expect(component).toBeTruthy();

        component.toggleSidenav();
        expect(spy).toHaveBeenCalledWith();
    });

    it('should show login notification', waitForAsync(async () => {
        spyOn(returnObj.observable, 'getValue').and.returnValue(null);
        setupTest();

        await setAsyncTimeout(20);
        expect(component.isLoginWarningShown).toBeTrue();
    }));

    it('should not show login notification', waitForAsync(async () => {
        spyOn(returnObj.observable, 'getValue').and.returnValue({} as any);
        setupTest();

        await setAsyncTimeout(20);
        expect(component.isLoginWarningShown).toBeFalse();
    }));

    it('should show cookies notification', () => {
        setupTest();

        expect(component.isCookiesNotificationShown).toBeTrue();
    });

    it('should not show cookies notification', () => {
        localStorageMock[cookiesKey] = 'true';
        setupTest();

        expect(component.isCookiesNotificationShown).toBeFalse();
    });

    it('should hide cookies notification', () => {
        setupTest();

        expect(component.isCookiesNotificationShown).toBeTrue();
        component.acceptCookies();
        expect(component.isCookiesNotificationShown).toBeFalse();
        expect(localStorageMock[cookiesKey]).toBe('true');
    });

    function setupTest() {
        fixture = TestBed.createComponent(NavComponent);
        component = fixture.componentInstance;
        service = TestBed.inject(NavService);
        TestBed.inject(AccountService);
        fixture.detectChanges();
    }
});
