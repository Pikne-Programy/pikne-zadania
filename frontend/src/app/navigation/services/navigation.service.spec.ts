/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { NavService } from './navigation.service';

xdescribe('Service: Navigation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NavService],
    });
  });

  it('should ...', inject([NavService], (service: NavService) => {
    expect(service).toBeTruthy();
  }));
});
