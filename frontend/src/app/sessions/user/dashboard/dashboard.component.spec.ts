import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SessionUserDashboardComponent } from './dashboard.component';

xdescribe('SessionUserDashboardComponent', () => {
    let component: SessionUserDashboardComponent;
    let fixture: ComponentFixture<SessionUserDashboardComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [SessionUserDashboardComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SessionUserDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
