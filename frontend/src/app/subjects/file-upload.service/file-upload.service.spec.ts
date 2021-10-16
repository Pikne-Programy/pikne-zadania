/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { FileUploadService } from './file-upload.service';

xdescribe('Service: FileUpload', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [FileUploadService]
        });
    });

    it('should ...', inject([FileUploadService], (service: FileUploadService) => {
        expect(service).toBeTruthy();
    }));
});
