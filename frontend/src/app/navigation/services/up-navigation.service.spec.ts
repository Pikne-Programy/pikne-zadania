/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { UpNavService } from './up-navigation.service';

describe('Service: UpNavigation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UpNavService],
    });
  });

  it('should ...', inject([UpNavService], (service: UpNavService) => {
    expect(service).toBeTruthy();
  }));
});
