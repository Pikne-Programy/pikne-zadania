import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SessionTeacherDashboardComponent } from './dashboard.component';

xdescribe('SessionTeacherDashboardComponent', () => {
    let component: SessionTeacherDashboardComponent;
    let fixture: ComponentFixture<SessionTeacherDashboardComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SessionTeacherDashboardComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SessionTeacherDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
