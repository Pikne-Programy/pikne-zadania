// Copyright 2021 Miłosz Wąsacz <wasacz.dev@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import {
    ComponentFixture,
    fakeAsync,
    inject,
    TestBed,
    tick,
    waitForAsync
} from '@angular/core/testing';

import { AboutComponent } from './about.component';
import { UpNavService } from '../navigation/services/up-navigation.service';
import { setAsyncTimeout } from '../helper/tests/tests.utils';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

describe('AboutComponent', () => {
    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;
    const upNavServiceMock = {
        navigateBack: () => {}
    };
    let service: UpNavService;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AboutComponent],
            providers: [{ provide: UpNavService, useValue: upNavServiceMock }]
        }).compileComponents();

        fixture = TestBed.createComponent(AboutComponent);
        component = fixture.componentInstance;
        service = TestBed.inject(UpNavService);
        fixture.detectChanges();
    }));

    it('should create', inject([UpNavService], () => {
        expect(component).toBeTruthy();
    }));

    /* it('should navigate back on button click', waitForAsync(
        inject([UpNavService], fakeAsync((service: UpNavService) => {
            spyOn(component, 'back').and.callThrough();
            spyOn(service, 'navigateBack');
            // const serviceSpy = spyOn(service, 'navigateBack');
            // const clickSpy = spyOn(component, 'back').and.callThrough();
            const button = (
                fixture.debugElement.nativeElement as HTMLElement
            ).querySelector<HTMLElement>('.is-back-button');

            expect(button).withContext("can't find button").toBeTruthy();
            button?.dispatchEvent(new Event('click'));

            tick();
            fixture.detectChanges();
            // fixture.whenStable().then(() => {
            expect(component.back).toHaveBeenCalledWith();
            expect(service.navigateBack).toHaveBeenCalledWith();
            // });
        }))
    )); */
    it('should navigate back on button click', () => {
        const spy = spyOn(service, 'navigateBack');
        component.back();
        expect(spy.calls.any()).toBeTrue();
    });
});
