import { TestBed, inject } from '@angular/core/testing';
import { ReportService } from './report.service';

xdescribe('Service: Report', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ReportService]
        });
    });

    it('should ...', inject([ReportService], (service: ReportService) => {
        expect(service).toBeTruthy();
    }));
});
