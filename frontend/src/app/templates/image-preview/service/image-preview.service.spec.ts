/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { ImagePreviewService, ImageType } from './image-preview.service';

describe('Service: ImagePreview', () => {
    const img: [string, string] = ['testUrl', 'Image loading error'];

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ImagePreviewService]
        });
    });

    it('should send info if modal opened or closed', inject(
        [ImagePreviewService],
        (service: ImagePreviewService) => {
            expect(service).toBeTruthy();
            let result: ImageType | null = null;
            let message = getMessage('first');
            service.getPreview((preview) =>
                expect(preview).withContext(message).toEqual(result)
            );

            //#region Open modal
            result = img;
            message = getMessage('opened');
            service.openPreview(img[0], img[1]);
            //#endregion

            //#region Close modal
            result = null;
            message = getMessage('closed');
            service.closePreview();
            //#endregion
        }
    ));
});

function getMessage(type: 'first' | 'opened' | 'closed') {
    switch (type) {
        case 'first':
            return 'Should be closed (initial state)';
        case 'opened':
            return 'Should be opened';
        case 'closed':
            return 'Should be closed';
    }
}
