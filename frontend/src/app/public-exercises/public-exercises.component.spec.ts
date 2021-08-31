/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PublicExercisesComponent } from './public-exercises.component';

xdescribe('PublicExercisesComponent', () => {
    let component: PublicExercisesComponent;
    let fixture: ComponentFixture<PublicExercisesComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [PublicExercisesComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(PublicExercisesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
