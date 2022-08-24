import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UnsavedChangesModalComponent } from './unsaved-changes-modal.component';

describe('UnsavedChangesModalComponent', () => {
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
        component.open = false;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.open).toBeFalse();
    });
});
