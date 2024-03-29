import { getStringFromAny } from '../helper/tests/tests.utils';
import {
    checkAndReplaceExerciseType,
    EqEx,
    Exercise,
    ExerciseType,
    ExerciseTypeFull,
    isExerciseType,
    PreviewEqEx,
    PreviewExercise
} from './exercises';

type EqExProblemType = {
    main: string;
    img?: string[];
    unknown: [string, string][];
};

describe('Exercise types', () => {
    describe('ExerciseType', () => {
        const correctTypes: (ExerciseType | ExerciseTypeFull)[] = [
            'EqEx',
            'EquationExercise'
        ];
        const wrongTypes = ['eqex', 'equationExercise', 'TrashType'];

        describe('isExerciseType', () => {
            it('should return true', () => {
                for (const value of correctTypes)
                    expect(isExerciseType(value)).withContext(value).toBeTrue();
            });

            it('should return false', () => {
                for (const value of wrongTypes) {
                    expect(isExerciseType(value))
                        .withContext(value)
                        .toBeFalse();
                }
            });
        });

        describe('checkAndReplaceExerciseType', () => {
            it('should return true & replace type', () => {
                const mappedTypes: ExerciseType[] = ['EqEx', 'EqEx'];
                if (mappedTypes.length !== correctTypes.length)
                    fail('Missing mapped types');

                const list: [{ type: string }, ExerciseType][] =
                    correctTypes.map((type, i) => [{ type }, mappedTypes[i]]);
                for (const [object, resultType] of list) {
                    expect(checkAndReplaceExerciseType(object))
                        .withContext(object.type)
                        .toBeTrue();
                    expect(object.type).toBe(resultType);
                }
            });

            it('should return false', () => {
                expect(checkAndReplaceExerciseType({}))
                    .withContext('_no-type_')
                    .toBeFalse();
                const list = wrongTypes.map((type) => ({ type }));
                for (const object of list) {
                    expect(checkAndReplaceExerciseType(object))
                        .withContext(object.type)
                        .toBeFalse();
                }
            });
        });
    });

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
                        name: 'EqEx',
                        problem: contentObj
                    },
                    true
                ],
                [
                    {
                        type: 'EqEx',
                        name: 'PreviewEqEx',
                        problem: contentObj,
                        correctAnswer: {
                            answers: [1, 2, 3]
                        }
                    },
                    true
                ],
                //TODO Tests with different types
                /*
                [
                    {
                        type: 'PicEx',
                        name: 'PicEx',
                        problem: contentObj,
                        done: 0.14,
                    },
                    true,
                ],
                [
                    {
                        type: 'MultiEx',
                        name: 'MultiEx',
                        problem: contentObj,
                        done: null,
                    },
                    true,
                ],
                */
                [
                    {
                        type: 'EqEx',
                        name: 'Wrong EqEx'
                    },
                    false
                ],
                [
                    {
                        type: false,
                        name: 1,
                        problem: null,
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
                    problem: contentObj
                };
                expect(Exercise.isExercise(obj, id, subjectId)).toBeFalse();
            });

            it('should return true & replace type', () => {
                const typeMap = new Map<string, string>([
                    ['EqEx', 'EquationExercise']
                ]);
                const objects: { type: string }[] = list
                    .filter(([_, result]) => result)
                    .map(([obj, _]) => obj)
                    .concat([]);
                for (const exercise of objects) {
                    const resultType = exercise.type;
                    exercise.type =
                        typeMap.get(exercise.type) ?? 'TYPE_NOT_FOUND';
                    expect(Exercise.isExercise(exercise, id, subjectId))
                        .withContext(exercise.type)
                        .toBeTrue();
                    expect(exercise.type)
                        .withContext(exercise.type)
                        .toBe(resultType);
                }
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
        describe('constructor', () => {
            //#region Mock values
            const id = 'ex1';
            const subjectId = 'Sb1';
            const name = 'Ex1';
            const problem: EqExProblemType = {
                main: 'Description',
                unknown: [
                    ['x', 'km'],
                    ['t', 's']
                ]
            };
            const problemWithImg: EqExProblemType = {
                main: 'Description',
                img: ['1.png', '2.jpg'],
                unknown: [
                    ['x', 'km'],
                    ['t', 's']
                ]
            };
            const done = 0.15;
            //#endregion

            it('should create new instance', () => {
                const obj = new EqEx(id, subjectId, name, problem);
                expect(obj).toBeInstanceOf(EqEx);
            });

            it('should create new instance w/ done', () => {
                const obj = new EqEx(id, subjectId, name, problem, done);
                expect(obj).toBeInstanceOf(EqEx);
                expect(obj.done).toBe(done);
            });

            it('should create new instance w/ done null', () => {
                const obj = new EqEx(id, subjectId, name, problem, null);
                expect(obj).toBeInstanceOf(EqEx);
                expect(obj.done).toBeNull();
            });

            it('should create new instance w/ images', () => {
                const obj = new EqEx(id, subjectId, name, problemWithImg);
                expect(obj).toBeInstanceOf(EqEx);
                expect(obj.problem).toEqual(problemWithImg);
            });
        });

        describe('isEqEx', () => {
            //#region Test objects
            const id = 'test-id';
            const subjectId = 'test-sb-id';
            const unknown: [string, string][] = [
                ['x', 'km'],
                ['t', 's']
            ];
            const list: [any, boolean][] = [
                [
                    {
                        main: 'correct',
                        unknown
                    },
                    true
                ],
                [
                    {
                        main: 'wrong unknowns',
                        unknown: [
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
                        unknown
                    },
                    true
                ],
                [
                    {
                        main: 'wrong img type',
                        img: '1.png',
                        unknown
                    },
                    false
                ],
                [
                    {
                        main: "wrong img items' types",
                        img: ['abc.png', 123],
                        unknown
                    },
                    false
                ],
                [
                    {
                        main: 'correct teacher version',
                        img: [],
                        unknown,
                        correct: [2.5, 125]
                    },
                    true
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
                    problem: contentObj
                };
                it(`should return ${result} (${getStringFromAny(
                    obj.problem.main,
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

        describe('getAnswerObject', () => {
            const list: [string, (number | null)[]][] = [
                ['number', [1, 2, 3]],
                ['null', [null, null, null]],
                ['mixed', [1, null, 5.5, null]]
            ];
            for (const [arrayType, answers] of list) {
                it(`should return object w/ ${arrayType} array`, () => {
                    expect(EqEx.getAnswerObject(answers)).toEqual({ answers });
                });
            }
        });
    });

    //#region Previews
    describe('PreviewExercise', () => {
        //#region Mock values
        const id = 'ex1';
        const subjectId = 'Sb1';
        const type = 'EqEx';
        const name = 'Ex1';
        const problem = {};
        //#endregion

        describe('constructor', () => {
            it('should create new instance', () => {
                const obj = new PreviewExercise(
                    id,
                    subjectId,
                    type,
                    name,
                    problem
                );
                expect(obj).toBeInstanceOf(PreviewExercise);
                expect(obj.correctAnswer).toEqual({});
            });
        });

        describe('isPreviewExercise', () => {
            it('should return false', () => {
                const obj = {
                    id,
                    subjectId,
                    type,
                    name,
                    problem
                };

                expect(
                    PreviewExercise.isPreviewExercise(obj as Exercise)
                ).toBeFalse();
            });

            it('should return true', () => {
                const obj = {
                    id,
                    subjectId,
                    type,
                    name,
                    problem,
                    correctAnswer: {}
                };

                expect(
                    PreviewExercise.isPreviewExercise(obj as Exercise)
                ).toBeTrue();
            });
        });
    });

    describe('PreviewEqEx', () => {
        //#region Mock values
        const id = 'ex1';
        const subjectId = 'Sb1';
        const name = 'Ex1';
        const problem: EqExProblemType = {
            main: 'Description',
            unknown: [
                ['x', 'km'],
                ['t', 's']
            ]
        };
        const correctAnswer = {
            answers: [1.2, 3.4]
        };
        const done = 1.5;
        //#endregion

        describe('constructor', () => {
            it('should create new instance', () => {
                const obj = new PreviewEqEx(
                    id,
                    subjectId,
                    name,
                    problem,
                    correctAnswer
                );
                expect(obj).toBeInstanceOf(PreviewEqEx);
            });

            it('should create new instance w/ done', () => {
                const obj = new PreviewEqEx(
                    id,
                    subjectId,
                    name,
                    problem,
                    correctAnswer,
                    done
                );
                expect(obj).toBeInstanceOf(PreviewEqEx);
                expect(obj.done).toBe(done);
            });

            it('should create new instance w/ done null', () => {
                const obj = new PreviewEqEx(
                    id,
                    subjectId,
                    name,
                    problem,
                    correctAnswer,
                    null
                );
                expect(obj).toBeInstanceOf(PreviewEqEx);
                expect(obj.done).toBeNull();
            });

            it('should create new instance w/ images', () => {
                const problemWithImg: EqExProblemType = {
                    main: 'Description',
                    img: ['1.png', '2.jpg'],
                    unknown: [
                        ['x', 'km'],
                        ['t', 's']
                    ]
                };

                const obj = new PreviewEqEx(
                    id,
                    subjectId,
                    name,
                    problemWithImg,
                    correctAnswer
                );
                expect(obj).toBeInstanceOf(PreviewEqEx);
                expect(obj.problem).toEqual(problemWithImg);
            });
        });

        describe('isPreviewExercise', () => {
            const type = 'EqEx';

            it('should return false (not an EqEx)', () => {
                const obj = {
                    id,
                    subjectId,
                    type,
                    name,
                    problem: {},
                    correctAnswer
                };

                expect(
                    PreviewEqEx.isPreviewExercise(obj as Exercise)
                ).toBeFalse();
            });

            it('should return false (not a PreviewExercise)', () => {
                const obj = {
                    id,
                    subjectId,
                    type,
                    name,
                    problem
                };

                expect(
                    PreviewEqEx.isPreviewExercise(obj as Exercise)
                ).toBeFalse();
            });

            it("should return false (wrong 'correctAnswer' type)", () => {
                const list: [string, any][] = [
                    [
                        "missing 'answers' field",
                        {
                            id,
                            subjectId,
                            type,
                            name,
                            problem,
                            correctAnswer: {}
                        }
                    ],
                    [
                        "wrong 'answers' type",
                        {
                            id,
                            subjectId,
                            type,
                            name,
                            problem,
                            correctAnswer: {
                                answers: true
                            }
                        }
                    ],
                    [
                        "wrong 'answers' items' type",
                        {
                            id,
                            subjectId,
                            type,
                            name,
                            problem,
                            correctAnswer: {
                                answers: [1.2, 'good', false]
                            }
                        }
                    ]
                ];

                for (const [reason, obj] of list) {
                    expect(PreviewEqEx.isPreviewExercise(obj as Exercise))
                        .withContext(reason)
                        .toBeFalse();
                }
            });

            it('should return true', () => {
                const obj = {
                    id,
                    subjectId,
                    type,
                    name,
                    problem,
                    correctAnswer
                };

                expect(
                    PreviewEqEx.isPreviewExercise(obj as Exercise)
                ).toBeTrue();
            });
        });
    });
    //#endregion
});
