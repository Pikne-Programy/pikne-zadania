// Copyright 2021 Miłosz Wąsacz <wasacz.dev@gmail.com>
//
// SPDX-License-Identifier: AGPL-3.0-or-later

/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import {
    ComponentFixture,
    inject,
    TestBed,
    waitForAsync
} from '@angular/core/testing';

import { AboutComponent } from './about.component';
import { UpNavService } from '../navigation/services/up-navigation.service';

describe('AboutComponent', () => {
    let component: AboutComponent;
    let fixture: ComponentFixture<AboutComponent>;
    const upNavServiceMock = {
        navigateBack: () => {}
    };

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AboutComponent],
                providers: [
                    { provide: UpNavService, useValue: upNavServiceMock }
                ]
            }).compileComponents();

            fixture = TestBed.createComponent(AboutComponent);
            component = fixture.componentInstance;
        })
    );

    it('should create', inject([UpNavService], () => {
        expect(component).toBeTruthy();
    }));

    it('should navigate back on button click', inject([UpNavService], (service: UpNavService) => {
        const serviceSpy = spyOn(service, 'navigateBack');
        const clickSpy = spyOn(component, 'back').and.callThrough();
        const button = (
            fixture.debugElement.nativeElement as HTMLElement
        ).querySelector<HTMLElement>('.is-back-button');

        expect(button).withContext("can't find button").toBeTruthy();
        button?.click();

        fixture.whenStable().then(() => {
            expect(clickSpy).toHaveBeenCalledWith();
            expect(serviceSpy).toHaveBeenCalledWith();
        });
    }));
});
