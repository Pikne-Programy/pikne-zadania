/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PanelComponent } from '../panel/panel.component';

import { SelectComponent } from './select.component';

describe('SelectComponent', () => {
    let component: SelectComponent;
    let fixture: ComponentFixture<WrapperComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SelectComponent, PanelComponent, WrapperComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(WrapperComponent);
        component = fixture.debugElement.componentInstance.selectComponent;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return appropriate host css class', () => {
        expect(component).toBeTruthy();
        for (const isRoot of [undefined, true, false]) {
            component.isRoot = isRoot;
            expect(component.class).toBe(
                'section' + (isRoot !== false ? ' is-root' : '')
            );
        }
    });
});

@Component({
    template: `
        <ng-template #prefix>Prefix div</ng-template>
        <ng-template #suffix>Suffix div</ng-template>
        <app-select [prefix]="prefix" [suffix]="suffix"></app-select>
    `
})
class WrapperComponent {
    @ViewChild(SelectComponent, { static: true })
        selectComponent!: SelectComponent;
}
