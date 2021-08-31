/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { NavService } from './navigation.service';

xdescribe('Service: Navigation', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NavService]
        });
    });

    it('should ...', inject([NavService], (service: NavService) => {
        expect(service).toBeTruthy();
    }));
});
