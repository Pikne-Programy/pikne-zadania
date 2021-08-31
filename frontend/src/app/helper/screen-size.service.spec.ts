/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { ScreenSizes, ScreenSizeService, SIZES } from './screen-size.service';

describe('Service: ScreenSize', () => {
    let windowWidthSpy: jasmine.Spy<jasmine.Func>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ScreenSizeService]
        });
        windowWidthSpy = spyOnProperty(window, 'innerWidth').and.returnValue(
            SIZES[ScreenSizes.DESKTOP][1]
        );
    });

    it('should update current size', inject(
        [ScreenSizeService],
        (service: ScreenSizeService) => {
            expect(service).toBeTruthy();
            const currentSizeSpy = spyOn(
                service.currentSize,
                'next'
            ).and.stub();
            for (const [size, width] of SIZES) {
                if (size === ScreenSizes.DESKTOP) continue;

                windowWidthSpy.and.returnValue(
                    width === -1 ? 2000 : width - 10
                );
                window.dispatchEvent(new Event('resize'));
                expect(currentSizeSpy).toHaveBeenCalledWith(size);
            }
        }
    ));

    it('should leave current size', inject(
        [ScreenSizeService],
        (service: ScreenSizeService) => {
            expect(service).toBeTruthy();
            const currentSizeSpy = spyOn(
                service.currentSize,
                'next'
            ).and.stub();
            for (
                let i = SIZES[ScreenSizes.TABLET][1] + 1;
                i <= SIZES[ScreenSizes.DESKTOP][1];
                i += 75
            ) {
                windowWidthSpy.and.returnValue(i);
                window.dispatchEvent(new Event('resize'));
                expect(currentSizeSpy).not.toHaveBeenCalled();
            }
        }
    ));
});
