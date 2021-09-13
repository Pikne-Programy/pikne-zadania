/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { HierarchyService } from './hierarchy.service';

xdescribe('Service: Hierarchy', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [HierarchyService]
        });
    });

    it('should ...', inject([HierarchyService], (service: HierarchyService) => {
        expect(service).toBeTruthy();
    }));
});
