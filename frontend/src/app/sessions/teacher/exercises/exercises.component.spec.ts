import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddSessionExercisesComponent } from './exercises.component';

xdescribe('AddSessionExercisesComponent', () => {
    let component: AddSessionExercisesComponent;
    let fixture: ComponentFixture<AddSessionExercisesComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [AddSessionExercisesComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(AddSessionExercisesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
