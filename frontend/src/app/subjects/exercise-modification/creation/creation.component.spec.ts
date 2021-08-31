/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExerciseCreationComponent } from './creation.component';

xdescribe('ExerciseCreationComponent', () => {
    let component: ExerciseCreationComponent;
    let fixture: ComponentFixture<ExerciseCreationComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [ExerciseCreationComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(ExerciseCreationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
