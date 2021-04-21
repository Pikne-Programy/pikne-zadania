/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { RoleGuardService } from './role-guard.service';

describe('Service: RoleGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RoleGuardService]
    });
  });

  it('should ...', inject([RoleGuardService], (service: RoleGuardService) => {
    expect(service).toBeTruthy();
  }));
});
