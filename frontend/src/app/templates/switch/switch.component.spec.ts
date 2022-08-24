/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SwitchComponent } from './switch.component';

describe('SwitchComponent', () => {
    let component: SwitchComponent;
    let fixture: ComponentFixture<SwitchComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [SwitchComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(SwitchComponent);
        component = fixture.componentInstance;
        component.checked = false;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.checked).toBeFalse();
        expect(component.class).toBe('');
    });

    it('should return appropriate host css class', () => {
        const css = 'mock-css';
        expect(component).toBeTruthy();
        expect(component.class).toBe('');
        component.cssClass = css;
        expect(component.class).toBe(css);
    });
});
