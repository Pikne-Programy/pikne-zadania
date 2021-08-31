import { getStringFromAny } from '../helper/tests/tests.utils';
import { EqEx, Exercise, ExerciseType } from './exercises';

describe('Exercise types', () => {
    describe('Exercise', () => {
        describe('isExercise', () => {
            //#region Test objects
            const id = 'test-id';
            const subjectId = 'test-sb-id';
            const contentObj = {
                var1: 'abc',
                var2: 123
            };
            const list: [any, boolean][] = [
                [{}, false],
                [
                    {
                        type: 'EqEx',
                        name: 'Ex1',
                        content: contentObj
                    },
                    true
                ],
                //TODO Tests with different types
                /*
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
                */
                [
                    {
                        type: 'EqEx',
                        name: 'Ex4'
                    },
                    false
                ],
                [
                    {
                        type: false,
                        name: 1,
                        content: null,
                        done: 'well'
                    },
                    false
                ]
            ];
            //#endregion

            for (const [obj, result] of list) {
                it(`should return ${result} (${getStringFromAny(
                    obj.name,
                    '_missing-name_',
                    `_name-${obj.name as number}_`
                )})`, () => {
                    expect(Exercise.isExercise(obj, id, subjectId)).toBe(
                        result
                    );
                });
            }

            it('should return false (null)', () => {
                expect(Exercise.isExercise(null, id, subjectId)).toBeFalse();
            });

            it('should return false (unknown type)', () => {
                const obj = {
                    type: 'abc',
                    name: 'Ex0',
                    content: contentObj
                };
                expect(Exercise.isExercise(obj, id, subjectId)).toBeFalse();
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
                Exercise.setDone('' as ExerciseType, 'Ex2', 'Sb2', [
                    true,
                    false
                ]);
                expect(spy).not.toHaveBeenCalled();
            });
        });
    });

    describe('EqEx', () => {
        describe('isEqEx', () => {
            //#region Test objects
            const id = 'test-id';
            const subjectId = 'test-sb-id';
            const unknowns: [string, string][] = [
                ['x', 'km'],
                ['t', 's']
            ];
            const list: [any, boolean][] = [
                [
                    {
                        main: 'correct',
                        unknowns
                    },
                    true
                ],
                [
                    {
                        main: 'wrong unknowns',
                        unknowns: [
                            ['abc', '123'],
                            ['def', '456', '@!#']
                        ]
                    },
                    false
                ],
                [
                    {
                        main: 'correct w/ images',
                        img: ['1.png', '2.png'],
                        unknowns
                    },
                    true
                ],
                [
                    {
                        main: 'wrong img type',
                        img: '1.png',
                        unknowns
                    },
                    false
                ],
                [
                    {
                        main: "wrong img items' types",
                        img: ['abc.png', 123],
                        unknowns
                    },
                    false
                ],
                [
                    {
                        main: 'correct teacher version',
                        img: [],
                        unknowns,
                        correct: [2.5, 125]
                    },
                    true
                ],
                [
                    {
                        main: "wrong 'correct' type",
                        unknowns,
                        correct: 123
                    },
                    false
                ],
                [
                    {
                        main: "wrong 'correct' items' types",
                        unknowns,
                        correct: [123, 'abc']
                    },
                    false
                ]
            ];
            //#endregion

            for (let i = 0; i < list.length; i++) {
                const [contentObj, result] = list[i];
                const obj: Exercise = {
                    id,
                    subjectId,
                    type: 'EqEx',
                    name: `Ex${i + 1}`,
                    content: contentObj
                };
                it(`should return ${result} (${getStringFromAny(
                    obj.content.main,
                    '_no-description_'
                )})`, () => {
                    expect(EqEx.isEqEx(obj)).toBe(result);
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
                [[true, false], 2, true, 'correct']
            ];
            for (const [obj, length, result, testMess] of list) {
                it(`should return ${result} (${testMess})`, () => {
                    expect(EqEx.isEqExAnswer(obj, length)).toBe(result);
                });
            }
            it('should return false (null & undefined)', () => {
                expect(EqEx.isEqExAnswer(null, 1)).toBe(false);
                expect(EqEx.isEqExAnswer(undefined, 1)).toBe(false);
            });
        });
    });
});
