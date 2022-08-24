/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { AccountService } from 'src/app/account/account.service';
import { setAsyncTimeout, Subscription } from 'src/app/helper/tests/tests.utils';
import * as Utils from '../services/navigation.service';

import { NavbarComponent } from './navbar.component';

export class Subject<T> {
    constructor(private returnVal: T) {}

    subscribe: (next: (val: T) => void) => Subscription = (next) => {
        setTimeout(() => {
            next(this.returnVal);
        }, 2000);
        return new Subscription();
    };
}

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;

    const menuElements = [new Utils.MenuElement('text', 'mainLink')];
    const buttonElements = [
        new Utils.ButtonElement(
            'text',
            'classes',
            Utils.ButtonFunctionType.LOGOUT
        )
    ];
    const serviceMock = {
        toggleSidenav: () => {},
        sideNavOpened: new Subject(true),
        menuElements: new Subject(menuElements),
        buttonElements: new Subject(buttonElements)
    };
    const accountServiceMock = {};
    const routerMock = {
        routerState: {
            snapshot: {
                url: 'Mock URL'
            }
        }
    };

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [NavbarComponent],
            providers: [
                { provide: Utils.NavService, useValue: serviceMock },
                { provide: AccountService, useValue: accountServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', waitForAsync(
        inject([Utils.NavService, AccountService, Router], async () => {
            expect(component).toBeTruthy();

            expect(component.sideNavOpened).toBeFalse();
            expect(component.showTabs).toBeFalse();
            expect(component.menuElements).toBeUndefined();
            expect(component.buttonElements).toBeUndefined();

            await setAsyncTimeout(3000);
            expect(component.sideNavOpened).toBeTrue();
            expect(component.menuElements).toBe(menuElements);
            expect(component.buttonElements).toBe(buttonElements);
        })
    ));

    it('should toggle sidenav', inject(
        [Utils.NavService, AccountService, Router],
        (service: Utils.NavService) => {
            expect(component).toBeTruthy();
            expect(service).toBeTruthy();
            const spy = spyOn(serviceMock, 'toggleSidenav');

            component.toggleNavbar();
            expect(spy).toHaveBeenCalledWith();
        }
    ));

    it('should get query params', inject(
        [Utils.NavService, AccountService, Router],
        () => {
            expect(component).toBeTruthy();
            const menuElement = new Utils.MenuElement('text', 'link');
            const returnValue = { key: 'value' };
            const spy = spyOn(menuElement, 'getQueryParams').and.returnValue(
                returnValue
            );

            expect(component.getQueryParams(menuElement)).toEqual(returnValue);
            expect(spy).toHaveBeenCalledWith(
                routerMock.routerState.snapshot.url
            );
        }
    ));

    it('should execute button click', inject(
        [Utils.NavService, AccountService, Router],
        (
            _: Utils.NavService,
            accountService: AccountService,
            router: Router
        ) => {
            expect(component).toBeTruthy();
            //#region Mocks
            const buttonElement = new Utils.ButtonElement(
                'text',
                'classes',
                Utils.ButtonFunctionType.LOGOUT
            );
            const mock = {
                exec: (
                    _b: Utils.ButtonElement,
                    _r: Router,
                    _a: AccountService
                ) => {}
            };
            const spy = spyOn(mock, 'exec');
            spyOnProperty(Utils, 'executeButtonClick', 'get').and.callFake(
                () => (b, r, a) => {
                    mock.exec(b, r, a);
                }
            );
            //#endregion

            component.execute(buttonElement);
            expect(spy).toHaveBeenCalledWith(
                buttonElement,
                router,
                accountService
            );
        }
    ));
});
