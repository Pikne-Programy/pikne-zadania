import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CurrentReportComponent } from './report.component';

xdescribe('CurrentReportComponent', () => {
    let component: CurrentReportComponent;
    let fixture: ComponentFixture<CurrentReportComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [CurrentReportComponent]
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CurrentReportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
