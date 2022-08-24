import { TestBed, inject } from '@angular/core/testing';
import { UserSessionService } from './user-session.service';

xdescribe('Service: UserSession', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [UserSessionService]
        });
    });

    it('should ...', inject(
        [UserSessionService],
        (service: UserSessionService) => {
            expect(service).toBeTruthy();
        }
    ));
});
