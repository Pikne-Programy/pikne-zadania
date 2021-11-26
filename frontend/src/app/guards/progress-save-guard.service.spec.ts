/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {
    ModificationComponent,
    ProgressSaveGuardService
} from './progress-save-guard.service';

describe('Service: ProgressSaveGuard', () => {
    describe('canDeactivate', () => {
        let component: TestComponent;
        let isModifiedSpy: jasmine.Spy<() => boolean>;
        const currentRoute = {} as ActivatedRouteSnapshot;
        const currentState = {} as RouterStateSnapshot;
        const route = '/route1';
        const nextState = {
            url: route
        } as RouterStateSnapshot;

        beforeEach(() => {
            TestBed.configureTestingModule({
                providers: [ProgressSaveGuardService]
            });

            component = new TestComponent();
            isModifiedSpy = spyOn(component, 'isModified');
        });

        it('should pass through', inject(
            [ProgressSaveGuardService],
            (service: ProgressSaveGuardService) => {
                expect(service).toBeTruthy();

                //#region Not modified
                isModifiedSpy.and.returnValue(false);
                expect(
                    service.canDeactivate(component, currentRoute, currentState)
                )
                    .withContext('Not modified')
                    .toBeTrue();
                //#endregion

                //#region Submitted
                isModifiedSpy.and.returnValue(true);
                component.submit();
                expect(
                    service.canDeactivate(component, currentRoute, currentState)
                )
                    .withContext('Submitted')
                    .toBeTrue();
                //#endregion

                //#region Exit confirmed
                isModifiedSpy.and.returnValue(true);
                component.exit();
                expect(
                    service.canDeactivate(component, currentRoute, currentState)
                )
                    .withContext('Exit confirmed')
                    .toBeTrue();
                //#endregion
            }
        ));

        it('should not pass through', inject(
            [ProgressSaveGuardService],
            (service: ProgressSaveGuardService) => {
                expect(service).toBeTruthy();
                isModifiedSpy.and.returnValue(true);

                expect(
                    service.canDeactivate(component, currentRoute, currentState)
                ).toBeFalse();
                expect(component.isConfirmExitModalOpen).toBeTrue();
            }
        ));

        it('should not pass through (w/ nextState set)', inject(
            [ProgressSaveGuardService],
            (service: ProgressSaveGuardService) => {
                expect(service).toBeTruthy();
                isModifiedSpy.and.returnValue(true);

                expect(
                    service.canDeactivate(
                        component,
                        currentRoute,
                        currentState,
                        nextState
                    )
                ).toBeFalse();
                expect(component.isConfirmExitModalOpen).toBeTrue();
                expect(component.nextState).toBe(route);
            }
        ));
    });

    describe('ModificationComponent', () => {
        let component: TestComponent;

        beforeEach(() => {
            component = new TestComponent();
        });

        describe('setSubmitFlag', () => {
            it('should not have flag set', () => {
                expect(component.isSubmitted).toBeFalse();
            });

            it('should have flag set', () => {
                component.submit();
                expect(component.isSubmitted).toBeTrue();
            });
        });

        describe('confirmExit', () => {
            it('should not have flag set', () => {
                expect(component.isExitConfirmed).toBeFalse();
            });

            it('should have flag set', () => {
                component.exit();
                expect(component.isExitConfirmed).toBeTrue();
            });
        });

        describe('resetNavigation', () => {
            const route = '/route1';

            beforeEach(() => {
                component.nextState = route;
            });

            it('should have next route set', () => {
                expect(component.nextState).toBe(route);
            });

            it('should not have next route set', () => {
                component.resetNavigation();
                expect(component.nextState).toBeUndefined();
            });
        });

        describe('onExitCancel', () => {
            const route = '/route1';

            beforeEach(() => {
                component.isConfirmExitModalOpen = true;
                component.nextState = route;
            });

            it('should have modal open', () => {
                expect(component.isConfirmExitModalOpen).toBeTrue();
                expect(component.nextState).toBe(route);
            });

            it('should have modal closed', () => {
                component.onExitCancel();
                expect(component.isConfirmExitModalOpen).toBeFalse();
                expect(component.nextState).toBeUndefined();
            });
        });
    });
});

class TestComponent extends ModificationComponent {
    isModified(): boolean {
        throw new Error('Method not implemented.');
    }

    submit() {
        this.setSubmitFlag();
    }
    exit() {
        this.confirmExit();
    }

    onExitSubmit(): void {
        throw new Error('Method not implemented.');
    }
    onExitDiscard(): void {
        throw new Error('Method not implemented.');
    }
}
