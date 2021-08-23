/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { NavService } from './navigation.service';

describe('Service: Navingation', () => { // FIXME(Nircek): TYPO
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavService],
    });
  });

  it('should ...', inject([NavService], (service: NavService) => {
    expect(service).toBeTruthy();
  }));
});
