/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ErrorComponent } from './error.component';

describe('ErrorComponent', () => {
    let component: ErrorComponent;
    let fixture: ComponentFixture<ErrorComponent>;

    const code = 500;
    const message = 'Custom error message';
    const link = ['Custom link', '/custom-route'];

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ErrorComponent);
        component = fixture.componentInstance;
        component.code = code;
        component.message = message;
        component.link = link;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();

        expect(component.code).toBe(code);
        expect(component.message).toBe(message);
        expect(component.link).toBe(link);

        expect(typeof component.defaultMessage).toBe('string');
        expect(typeof component.defaultLink[0]).toBe('string');
        expect(component.defaultLink[1]).toBe('/public-exercises');
    });

    describe('getMessage', () => {
        beforeEach(() => {
            component.message = undefined;
        });

        it('should show provided message', () => {
            component.message = message;

            expect(component.getMessage()).toBe(message);
        });

        it('should show appropriate message according to error code', () => {
            const list: [number | string | undefined, string][] = [
                [401, 'Nie masz dostępu do tego, czego szukasz!'],
                [403, 'Nie masz dostępu do tego, czego szukasz!'],
                [404, 'To, czego szukasz, nie istnieje!'],
                [500, 'Wystąpił błąd serwera'],
                [502, component.defaultMessage],
                ['0x00AF21', component.defaultMessage],
                [undefined, component.defaultMessage]
            ];
            for (const [errorCode, errorMessage] of list) {
                component.code = errorCode;

                expect(component.getMessage())
                    .withContext(`Error ${errorCode}`)
                    .toBe(errorMessage);
            }
        });
    });
});
