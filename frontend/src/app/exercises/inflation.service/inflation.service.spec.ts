/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { Exercise } from 'src/app/exercise-service/exercises';
import { ExerciseInflationService } from './inflation.service';

describe('Service: ExerciseInflation', () => {
  const exercise = new Exercise('id', 'sbId', 'EqEx', 'ex1', {
    main: 'content',
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExerciseInflationService],
    });
  });

  it('should return Exercise', inject(
    [ExerciseInflationService],
    (service: ExerciseInflationService) => {
      expect(service).toBeTruthy();
      (service as any)._exercise = exercise;

      expect(service.getExercise()).toEqual(exercise);
    }
  ));

  it('should return null', inject(
    [ExerciseInflationService],
    (service: ExerciseInflationService) => {
      expect(service).toBeTruthy();
      (service as any)._exercise = null;

      expect(service.getExercise()).toBeNull();
    }
  ));

  it('should set Exercise', inject(
    [ExerciseInflationService],
    (service: ExerciseInflationService) => {
      expect(service).toBeTruthy();

      service.setExercise(exercise);
      expect((service as any)._exercise).toBe(exercise);
    }
  ));

  it('should reset Exercise', inject(
    [ExerciseInflationService],
    (service: ExerciseInflationService) => {
      expect(service).toBeTruthy();

      service.resetExercise();
      expect((service as any)._exercise).toBeNull();
    }
  ));
});
