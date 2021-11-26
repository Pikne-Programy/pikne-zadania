/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { UnsavedChangesModalComponent } from './unsaved-changes-modal.component';

xdescribe('UnsavedChangesModalComponent', () => {
    let component: UnsavedChangesModalComponent;
    let fixture: ComponentFixture<UnsavedChangesModalComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [UnsavedChangesModalComponent]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(UnsavedChangesModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
