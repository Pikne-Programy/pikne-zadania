/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ScreenSizeService } from './screen-size.service';

describe('Service: ScreenSize', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScreenSizeService]
    });
  });

  it('should ...', inject([ScreenSizeService], (service: ScreenSizeService) => {
    expect(service).toBeTruthy();
  }));
});
