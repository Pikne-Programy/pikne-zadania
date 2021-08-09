/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { ExerciseInflationService } from './inflation.service';

describe('Service: ExerciseData', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExerciseInflationService],
    });
  });

  it('should ...', inject(
    [ExerciseInflationService],
    (service: ExerciseInflationService) => {
      expect(service).toBeTruthy();
    }
  ));
});
