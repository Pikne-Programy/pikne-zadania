/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ExerciseModificationService } from './exercise-modification.service';

describe('Service: ExerciseModification', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExerciseModificationService]
    });
  });

  it('should ...', inject([ExerciseModificationService], (service: ExerciseModificationService) => {
    expect(service).toBeTruthy();
  }));
});
