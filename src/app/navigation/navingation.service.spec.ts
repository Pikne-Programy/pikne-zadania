/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NavService } from './navingation.service';

describe('Service: Navingation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavService],
    });
  });

  it('should ...', inject([NavService], (service: NavService) => {
    expect(service).toBeTruthy();
  }));
});
