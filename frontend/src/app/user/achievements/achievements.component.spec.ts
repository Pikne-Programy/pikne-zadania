/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AchievementsComponent } from './achievements.component';

//FIXME Add to coverage when implemented (angular.json > test > codeCoverageExclude)
xdescribe('AchievementsComponent', () => {
    let component: AchievementsComponent;
    let fixture: ComponentFixture<AchievementsComponent>;

    beforeEach(
        waitForAsync(() => {
            TestBed.configureTestingModule({
                declarations: [AchievementsComponent]
            }).compileComponents();
        })
    );

    beforeEach(() => {
        fixture = TestBed.createComponent(AchievementsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
