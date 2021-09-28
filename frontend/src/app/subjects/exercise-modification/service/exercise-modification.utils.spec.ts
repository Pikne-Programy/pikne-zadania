import { getToStringResult } from './exercise-modification.service.spec';
import {
    EqExHeader,
    Exercise,
    ExerciseHeader,
    isExerciseListType
} from './exercise-modification.utils';

describe('Exercise modification Utils', () => {
    describe('ExerciseListType', () => {
        it('should return false (wrong response object type)', () => {
            expect(isExerciseListType([]))
                .withContext('Not an object')
                .toBeFalse();
            expect(isExerciseListType({}))
                .withContext('Missing `exercises` field')
                .toBeFalse();
            expect(isExerciseListType({ exercises: 2 }))
                .withContext('Wrong `exercises` type')
                .toBeFalse();
        });

        it(`should return false (wrong items' types)`, () => {
            //#region Mock objects
            const id = 'ex1';
            const type = 'EqEx';
            const name = 'Ex1';
            const description = 'Test description';
            const wrongObjects: [any, string][] = [
                [{}, 'Missing fields'],
                [
                    {
                        id,
                        type: 1,
                        name,
                        description
                    },
                    'Wrong `type` type'
                ],
                [
                    {
                        id,
                        type,
                        name: false,
                        description
                    },
                    'Wrong `name` type'
                ],
                [
                    {
                        id: 1,
                        type,
                        name,
                        description: null
                    },
                    'Wrong `description` type'
                ]
            ];
            //#endregion

            for (const [object, testName] of wrongObjects) {
                expect(isExerciseListType({ exercises: [object] }))
                    .withContext(testName)
                    .toBeFalse();
            }
        });

        it('should return true', () => {
            //#region Mock objects
            const id = 'exId';
            const description = 'Test description';
            type TestType = {
                id: string;
                type: string;
                name: string;
                description: string;
            };
            const list: TestType[] = [
                {
                    id,
                    type: 'EqEx',
                    name: 'Ex1',
                    description
                },
                {
                    id,
                    type: 'EquationExercise',
                    name: 'Ex2',
                    description
                }
            ];
            //#endregion

            for (const object of list) {
                expect(isExerciseListType({ exercises: [object] }))
                    .withContext(object.name)
                    .toBeTrue();
            }
        });
    });

    describe('Exercise', () => {
        const content =
            'Z miast \\(A\\) i \\(B\\) odległych o d=300km wyruszają jednocześnie\ndwa pociągi z prędkościami v_a=[40;60]km/h oraz v_b=[60;80]km/h.\nW jakiej odległości x=?km od miasta \\(A\\) spotkają się te pociągi?\nPo jakim czasie t=?h się to stanie?\n---\nt=d/(v_a+v_b)\nx=t*v_a\n';
        const apiContent = `---\ntype: EqEx\nname: Pociągi dwa\n---\n${content}`;

        describe('createInstance', () => {
            it('create instance of Exercise', () => {
                try {
                    const exercise = Exercise.createInstance(apiContent);
                    expect(exercise).toBeInstanceOf(Exercise);
                    expect(exercise.header.type).toBe('EqEx');
                    expect(exercise.header.name).toBe('Pociągi dwa');
                    expect(exercise.content).toBe(content);
                }
                catch (_) {
                    fail('should create proper Exercise instance');
                }
            });

            it('should throw error (wrong header)', () => {
                try {
                    Exercise.createInstance(content);
                    fail('should throw error');
                }
                catch (error: any) {
                    const message: string = error.message;
                    expect(message).toBe('Wrong exercise header');
                }
            });
        });

        describe('toString', () => {
            const types = ['EqEx', 'EquationExercise', 'I am a trashy type'];
            for (const type of types) {
                it(`should stringify (type: ${type})`, () => {
                    const name = 'Ex1';

                    const exercise = new Exercise(
                        new ExerciseHeader(type, name),
                        content
                    );
                    expect(exercise.toString()).toBe(
                        getToStringResult(
                            `type: ${exercise.header.type}\nname: ${exercise.header.name}\n`,
                            content
                        )
                    );
                });
            }
        });

        describe('generateId', () => {
            const list: [string, string][] = [
                ['Pociągi dwa', 'pociagi-dwa'],
                ['pociagi-dwa', 'pociagi-dwa'],
                ['póĆíägî\u00a0\u00a0ĐwÃ', 'pociagi--%C4%91wa']
            ];

            it('should generate id from Exercise instance', () => {
                for (const [name, result] of list) {
                    const exercise = new Exercise(
                        new ExerciseHeader('EqEx', name)
                    );
                    expect(exercise.generateId())
                        .withContext(`Expected '${name}' to be '${result}'`)
                        .toBe(result);
                }
            });

            it('should generate id from string', () => {
                for (const [name, result] of list) {
                    expect(Exercise.generateId(name))
                        .withContext(`Expected '${name}' to be '${result}'`)
                        .toBe(result);
                }
            });
        });
    });

    describe('ExerciseHeader', () => {
        describe('isExerciseHeader', () => {
            it('should return true', () => {
                const object = {
                    type: 'EqEx',
                    name: 'Ex1'
                };
                expect(ExerciseHeader.isExerciseHeader(object)).toBeTrue();
            });

            it('should return false (missing fields)', () => {
                const object1 = {
                    eqEx: '',
                    name: 'Ex1'
                };
                expect(ExerciseHeader.isExerciseHeader(object1)).toBeFalse();

                const object2 = {
                    type: 'EqEx',
                    abc: 'trash'
                };
                expect(ExerciseHeader.isExerciseHeader(object2)).toBeFalse();
            });

            it('should return false (wrong field types)', () => {
                const object1 = {
                    type: 1,
                    name: 'Ex1'
                };
                expect(ExerciseHeader.isExerciseHeader(object1)).toBeFalse();

                const object2 = {
                    type: 'EqEx',
                    name: true
                };
                expect(ExerciseHeader.isExerciseHeader(object2)).toBeFalse();
            });
        });
    });

    describe('EqExHeader', () => {
        describe('isEqExHeader', () => {
            it('should return true', () => {
                const list = [
                    {
                        type: 'EqEx',
                        name: 'Ex1'
                    },
                    {
                        type: 'EqEx',
                        name: 'Ex1',
                        img: 'image.jpg'
                    },
                    {
                        type: 'EqEx',
                        name: 'Ex1',
                        img: ['image1.jpg', 'image2.jpg']
                    }
                ];
                for (const object of list) {
                    expect(EqExHeader.isEqExHeader(object))
                        .withContext(
                            `Checked object: ${JSON.stringify(object)}`
                        )
                        .toBeTrue();
                }
            });

            it('should return false (wrong `img` field type)', () => {
                const object = {
                    type: 'EqEx',
                    name: 'Ex1',
                    img: 2
                };
                expect(EqExHeader.isEqExHeader(object)).toBeFalse();
            });

            it(`should return false (wrong \`img\` items' types)`, () => {
                const object = {
                    type: 'EqEx',
                    name: 'Ex1',
                    img: ['image.jpg', 1, false]
                };
                expect(EqExHeader.isEqExHeader(object)).toBeFalse();
            });
        });
    });
});
