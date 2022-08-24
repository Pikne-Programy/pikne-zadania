/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { setAsyncTimeout, Subscription } from 'src/app/helper/tests/tests.utils';

import { ImagePreviewComponent } from './image-preview.component';
import { ImagePreviewService, ImageType } from './service/image-preview.service';

describe('ImagePreviewComponent', () => {
    let component: ImagePreviewComponent;
    let fixture: ComponentFixture<ImagePreviewComponent>;
    let preview: ImageType | null;
    const serviceMock = {
        getPreview: (callback: (preview: ImageType | null) => void) => {
            setTimeout(() => {
                callback(preview);
            }, 10);
            return new Subscription();
        },
        closePreview: () => {}
    };
    //#region Test cases
    const list: [string, ImageType | null][] = [
        ['null', null],
        ['src 1', ['src1', 'alt1']],
        ['src 2', ['src2/sub-link', 'alt 2']]
    ];
    //#endregion

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            declarations: [ImagePreviewComponent],
            providers: [{ provide: ImagePreviewService, useValue: serviceMock }]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ImagePreviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    for (const [testName, expected] of list) {
        it(`should create (${testName})`, async () => {
            expect(component).toBeTruthy();
            preview = expected;

            await setAsyncTimeout(50);
            expect(component.image).toEqual(expected);
        });
    }

    it('should close preview', () => {
        expect(component).toBeTruthy();
        const spy = spyOn(serviceMock, 'closePreview');

        component.close();
        expect(spy).toHaveBeenCalledWith();
    });
});
