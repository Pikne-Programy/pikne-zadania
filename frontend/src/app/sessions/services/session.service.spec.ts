import { TestBed, inject } from '@angular/core/testing';
import { SessionService } from './session.service';

xdescribe('Service: Session', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SessionService]
        });
    });

    it('should ...', inject([SessionService], (service: SessionService) => {
        expect(service).toBeTruthy();
    }));
});
