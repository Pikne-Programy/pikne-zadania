import { Exercise, ExerciseType } from './exercises';

describe('Exercise', () => {
  describe('isExercise', () => {
    //#region Test objects
    const contentObj = {};
    const list: [any, boolean][] = [
      [{}, false],
      [null, false],
      [
        {
          type: 'EqEx',
          name: 'Ex1',
          content: contentObj,
        },
        true,
      ],
      [
        {
          type: 'PicEx',
          name: 'Ex2',
          content: contentObj,
          done: 0.14,
        },
        true,
      ],
      [
        {
          type: 'MultiEx',
          name: 'Ex3',
          content: contentObj,
          done: null,
        },
        true,
      ],
      [
        {
          type: 'EqEx',
          name: 'Ex4',
        },
        false,
      ],
      [
        {
          type: false,
          name: 1,
          content: null,
          done: 'well',
        },
        false,
      ],
    ];
    //#endregion

    for (const [obj, result] of list) {
      it(`should return ${result} (${obj?.name ?? obj})`, () => {
        expect(Exercise.isExercise(obj)).toBe(result);
      });
    }
  });

  describe('isEqExAnswer', () => {
    const list: [any, number, boolean, string][] = [
      ['abc', 1, false, 'not an array'],
      [[], 0, true, 'empty array'],
      [[1, 2, 3], 3, false, 'array of numbers'],
      [[true, 'abc', 3], 3, false, 'array of mixed types'],
      [[true, false], 3, false, 'wrong length'],
      [[true, false], 2, true, 'correct'],
    ];
    for (const [obj, length, result, testMess] of list) {
      it(`should return ${result} (${testMess})`, () => {
        expect(Exercise.isEqExAnswer(obj, length)).toBe(result);
      });
    }
    it('should return false (null & undefined)', () => {
      expect(Exercise.isEqExAnswer(null, 1)).toBe(false);
      expect(Exercise.isEqExAnswer(undefined, 1)).toBe(false);
    });
  });

  describe('getDone', () => {
    let spy: jasmine.Spy<any>;

    beforeEach(() => {
      spy = spyOn(Object.getPrototypeOf(localStorage), 'getItem');
    });

    it('should not execute (done not undefined)', () => {
      Exercise.getDone({ done: 0.14 } as Exercise, 'Sb1');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should get done (done not saved in local storage)', () => {
      spy.and.returnValue(null);
      const exercise = { name: 'Ex2' } as Exercise;

      Exercise.getDone(exercise, 'Sb2');
      expect(spy).toHaveBeenCalledWith('Sb2/Ex2');
      expect(exercise.done).toBeUndefined();
    });

    it('should get done', () => {
      spy.and.returnValue('0.50');
      const exercise = { name: 'Ex3' } as Exercise;

      Exercise.getDone(exercise, 'Sb3');
      expect(spy).toHaveBeenCalledWith('Sb3/Ex3');
      expect(exercise.done).toBeDefined();
      expect(exercise.done).not.toBeNull();
      expect(exercise.done).toBeCloseTo(0.5);
    });
  });

  describe('setDone', () => {
    let spy: jasmine.Spy<any>;

    beforeEach(() => {
      spy = spyOn(Object.getPrototypeOf(localStorage), 'setItem');
    });

    it('should save correctly (EqEx)', () => {
      Exercise.setDone('EqEx', 'Ex1', 'Sb1', [true, false]);
      expect(spy).toHaveBeenCalledWith('Sb1/Ex1', '0.50');
    });

    it('should not execute (wrong type)', () => {
      Exercise.setDone('' as ExerciseType, 'Ex2', 'Sb2', [true, false]);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
