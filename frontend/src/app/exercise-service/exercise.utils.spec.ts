import {
    ExerciseTreeNode,
    ServerResponseNode,
    Subject
} from './exercise.utils';
import { ExerciseType } from './exercises';

const description = 'Test description';

describe('Exercise Utils', () => {
    describe('Subject', () => {
        describe('createSubject', () => {
            it('should return null (is not a Subject)', () => {
                const obj = {
                    name: 'Sb1',
                    children: 'ex1'
                };
                expect(Subject.createSubject(obj, false)).toBeNull();
            });

            it('should return Exercise tree', () => {
                const obj = {
                    name: 'Sb1',
                    children: [
                        {
                            name: 'Ex1',
                            children: 'ex1'
                        }
                    ]
                };
                expect(Subject.createSubject(obj, false)).toBeInstanceOf(
                    ExerciseTreeNode
                );
            });
        });

        describe('checkSubjectValidity', () => {
            it('should return false (root element is not a Subject)', () => {
                const obj = {
                    name: 'Ex1',
                    children: 'ex1'
                };
                expect(Subject.checkSubjectValidity(obj)).toBeFalse();
            });

            it('should return true (valid Subject)', () => {
                const obj: ServerResponseNode = {
                    name: 'Sb1',
                    children: [
                        {
                            name: 'Cat1',
                            children: [
                                {
                                    name: 'SubCat1',
                                    children: [
                                        {
                                            name: 'Ex1',
                                            children: 'ex1'
                                        }
                                    ]
                                },
                                {
                                    name: 'Ex2',
                                    children: 'ex2'
                                }
                            ]
                        },
                        {
                            name: 'Ex3',
                            children: 'ex3'
                        }
                    ]
                };
                expect(Subject.checkSubjectValidity(obj)).toBeTrue();
            });

            it("should return true (valid Subject w/ 'done')", () => {
                const obj = {
                    name: 'Sb1',
                    children: [
                        {
                            name: 'Ex1',
                            children: 'ex1',
                            done: 0.14
                        },
                        {
                            name: 'Ex2',
                            children: 'ex2',
                            done: null
                        }
                    ]
                };
                expect(Subject.checkSubjectValidity(obj)).toBeTrue();
            });

            it("should return false (wrong 'done' type)", () => {
                const obj = {
                    name: 'Sb1',
                    children: [
                        {
                            name: 'Ex1',
                            children: 'ex1',
                            done: 0.14
                        },
                        {
                            name: 'Ex2',
                            children: 'ex2',
                            done: 'good'
                        }
                    ]
                };
                expect(Subject.checkSubjectValidity(obj)).toBeFalse();
            });

            it("should return true (valid Subject w/ 'type' & 'description')", () => {
                const obj: ServerResponseNode = {
                    name: 'Sb1',
                    children: [
                        {
                            name: 'Cat1',
                            children: [
                                {
                                    name: 'SubCat1',
                                    children: [
                                        {
                                            type: 'EqEx',
                                            name: 'Ex1',
                                            children: 'ex1',
                                            description
                                        }
                                    ]
                                },
                                {
                                    type: 'EqEx',
                                    name: 'Ex2',
                                    children: 'ex2',
                                    description
                                }
                            ]
                        },
                        {
                            type: 'EqEx',
                            name: 'Ex3',
                            children: 'ex3',
                            description
                        }
                    ]
                };
                expect(Subject.checkSubjectValidity(obj, true)).toBeTrue();
            });

            it('should return false (missing type)', () => {
                const obj = {
                    name: 'Sb1',
                    children: [
                        {
                            name: 'Ex1',
                            children: 'ex1',
                            description
                        }
                    ]
                };
                expect(Subject.checkSubjectValidity(obj, true)).toBeFalse();
            });

            it("should return false (wrong 'type')", () => {
                const obj = {
                    name: 'Sb1',
                    children: [
                        {
                            type: 'Abc',
                            name: 'Ex1',
                            children: 'ex1',
                            description
                        }
                    ]
                };
                expect(Subject.checkSubjectValidity(obj, true)).toBeFalse();
            });

            it('should return true & replace type', () => {
                type Exercise = {
                    type: string;
                    name: string;
                    children: string;
                    description?: string;
                };
                const list: [Exercise, string][] = [
                    [
                        {
                            type: 'EquationExercise',
                            name: 'Ex1',
                            children: 'ex1',
                            description
                        },
                        'EqEx'
                    ]
                ];
                for (const [exercise, resultType] of list) {
                    const obj = {
                        name: 'Sb1',
                        children: [exercise]
                    };
                    expect(Subject.checkSubjectValidity(obj, true))
                        .withContext(exercise.type)
                        .toBeTrue();
                    expect(exercise.type)
                        .withContext(exercise.type)
                        .toBe(resultType);
                }
            });
        });
    });

    describe('ExerciseTreeNode', () => {
        //#region Objects
        const obj1 = {
            name: 'Sb1',
            children: [
                {
                    name: 'Ex1',
                    children: 'ex1'
                }
            ]
        };
        const objWithType1 = {
            name: 'Sb1',
            children: [
                {
                    type: 'EqEx',
                    name: 'Ex1',
                    children: 'ex1',
                    description
                }
            ]
        };
        const obj3 = {
            name: 'Sb1',
            children: [
                {
                    name: 'Cat1',
                    children: [
                        {
                            name: 'SubCat1',
                            children: [
                                {
                                    name: 'Ex1',
                                    children: 'ex1'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        const objWithType3 = {
            name: 'Sb1',
            children: [
                {
                    name: 'Cat1',
                    children: [
                        {
                            name: 'SubCat1',
                            children: [
                                {
                                    type: 'EqEx',
                                    name: 'Ex1',
                                    children: 'ex1',
                                    description
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        //#endregion

        /* eslint-disable jasmine/missing-expect */
        describe('createExerciseTree', () => {
            const testMess = 'should create Exercise Tree';

            it(`${testMess} (depth 1)`, () => {
                const subject = ExerciseTreeNode.createExerciseTree(
                    false,
                    obj1.name,
                    obj1.children,
                    obj1.name
                );
                expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
                const exercise = subject.children[0];
                expectToBeExerciseTreeNode(exercise, 'Ex1', 0, subject, 'ex1');
            });

            it(`${testMess} (depth 3)`, () => {
                const subject = ExerciseTreeNode.createExerciseTree(
                    false,
                    obj3.name,
                    obj3.children,
                    obj3.name
                );
                expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
                const category = subject.children[0];
                expectToBeExerciseTreeNode(category, 'Cat1', 1, subject);
                const subCategory = category.children[0];
                expectToBeExerciseTreeNode(subCategory, 'SubCat1', 1, category);
                const exercise = subCategory.children[0];
                expectToBeExerciseTreeNode(
                    exercise,
                    'Ex1',
                    0,
                    subCategory,
                    'ex1'
                );
            });

            it(`${testMess} (depth 1 w/ type)`, () => {
                const subject = ExerciseTreeNode.createExerciseTree(
                    false,
                    objWithType1.name,
                    objWithType1.children as ServerResponseNode[],
                    objWithType1.name
                );
                expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
                const exercise = subject.children[0];
                expectToBeExerciseTreeNode(
                    exercise,
                    'Ex1',
                    0,
                    subject,
                    'ex1',
                    'EqEx'
                );
            });

            it(`${testMess} (depth 3 w/ type)`, () => {
                const subject = ExerciseTreeNode.createExerciseTree(
                    false,
                    objWithType3.name,
                    objWithType3.children as ServerResponseNode[],
                    objWithType3.name
                );
                expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
                const category = subject.children[0];
                expectToBeExerciseTreeNode(category, 'Cat1', 1, subject);
                const subCategory = category.children[0];
                expectToBeExerciseTreeNode(subCategory, 'SubCat1', 1, category);
                const exercise = subCategory.children[0];
                expectToBeExerciseTreeNode(
                    exercise,
                    'Ex1',
                    0,
                    subCategory,
                    'ex1',
                    'EqEx'
                );
            });

            it(`${testMess} w/ done from localStorage`, () => {
                //#region Mocks & spies
                const spy = spyOn(Storage.prototype, 'getItem');
                const list: [string, string | null, number | null][] = [
                    ['item not found', null, null],
                    ["item 'null'", 'null', null],
                    ['item is NaN', 'abc', null],
                    ['item is valid', '0.15', 0.15]
                ];
                //#endregion
                for (const [context, spyReturnValue, expectedResult] of list) {
                    spy.and.returnValue(spyReturnValue);

                    const subject = ExerciseTreeNode.createExerciseTree(
                        true,
                        obj1.name,
                        obj1.children,
                        obj1.name
                    );
                    expectToBeExerciseTreeNode(subject, 'Sb1', 1, null);
                    const exercise = subject.children[0];
                    expectToBeExerciseTreeNode(exercise, 'Ex1', 0, subject);

                    if (expectedResult === null)
                        expect(exercise.done).withContext(context).toBeNull();
                    else {
                        expect(exercise.done)
                            .withContext(context)
                            .toBeCloseTo(expectedResult);
                    }
                }
            });

            it(`${testMess} w/ saving done to localStorage`, () => {
                //#region Mocks & spies
                const spy = spyOn(Storage.prototype, 'setItem').and.stub();
                const subjectId = 'Sb1';
                const exerciseId = 'ex1';
                const list: [any, number | null, string][] = [
                    [
                        {
                            name: subjectId,
                            children: [
                                {
                                    name: 'Ex1',
                                    children: exerciseId,
                                    done: null
                                }
                            ]
                        },
                        null,
                        'null'
                    ],
                    [
                        {
                            name: subjectId,
                            children: [
                                {
                                    name: 'Ex1',
                                    children: exerciseId,
                                    done: 0.15
                                }
                            ]
                        },
                        0.15,
                        '0.15'
                    ]
                ];
                //#endregion
                for (const [obj, done, expectedSavedDone] of list) {
                    const subject = ExerciseTreeNode.createExerciseTree(
                        true,
                        obj.name,
                        obj.children,
                        obj.name
                    );
                    expectToBeExerciseTreeNode(subject, subjectId, 1, null);
                    const exercise = subject.children[0];
                    expectToBeExerciseTreeNode(exercise, 'Ex1', 0, subject);

                    if (done === null) {
                        expect(exercise.done)
                            .withContext(expectedSavedDone)
                            .toBeNull();
                    }
                    else {
                        expect(exercise.done)
                            .withContext(expectedSavedDone)
                            .toBeCloseTo(done);
                    }
                    expect(spy).toHaveBeenCalledWith(
                        `${subjectId}/${exerciseId}`,
                        expectedSavedDone
                    );
                }
            });
        });
        /* eslint-enable jasmine/missing-expect */
    });
});

function expectToBeExerciseTreeNode(
    obj: ExerciseTreeNode,
    value: string,
    childrenSize: number,
    parent: ExerciseTreeNode | null,
    url: string | null = null,
    type?: ExerciseType
) {
    expect(obj).toBeInstanceOf(ExerciseTreeNode);

    expect(obj.value).toBe(value);

    if (childrenSize > 0) {
        expect(obj.children)
            .withContext(
                `Expected [ ${obj.children
                    .map((item) => item.value)
                    .join(', ')} ] to have size ${childrenSize}`
            )
            .toHaveSize(childrenSize);
    }

    expect(obj.parent).toBe(parent);

    if (type) {
        expect(obj.type).toBe(type);
        expect(obj.description).toBe(description);
    }

    if (url) {
        expect(obj.url).toBe(url);
        if (childrenSize > 0)
            fail('should be Exercise with no children (wrong test)');
        else expect(obj.children).toHaveSize(0);
    }
}
