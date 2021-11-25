/* global DoneFn */

import { BehaviorSubject } from 'rxjs';
import {
    capitalize,
    getErrorCode,
    isObject,
    propertyTypes,
    pbkdf2,
    replaceAccents,
    INTERNAL_ERROR,
    removeMathTabIndex
} from './utils';

describe('Utils', () => {
    describe('capitalize', () => {
        it('should capitalize first letter', () => {
            [
                ['abc', 'Abc'],
                ['ddd', 'Ddd'],
                ['f', 'F'],
                ['ł', 'Ł'],
                ['ala ma kota', 'Ala ma kota'],
                ['aLa Ma KoTa', 'ALa Ma KoTa']
            ].forEach(([text, capitalized]) => {
                expect(capitalize(text)).toBe(capitalized);
            });
        });

        it('should remain the same', () => {
            [
                'AAA',
                'Ddd',
                '  aa aa  ',
                'A B C',
                'Ala ma kota',
                'ALA MA KOTA',
                'Ł',
                '%%%%',
                '112',
                '/$$',
                ''
            ].forEach((text) => {
                expect(capitalize(text)).toBe(text);
            });
        });

        it('should be null', () => {
            expect(capitalize(null)).toBeNull();
        });
    });

    describe('isObject', () => {
        it('should correctly check object type (no array properties)', () => {
            const expected = [
                'abc',
                123,
                BigInt('123'),
                true,
                Symbol('desc'),
                undefined,
                Object({ test: 123 }),
                () => {},
                null
            ];
            //#region Checking examples
            expect(expected.length)
                .withContext("types & examples don't overlap")
                .toEqual(propertyTypes.length);
            if (expected.length === propertyTypes.length) {
                for (let i = 0; i < expected.length; i++) {
                    if (expected[i] !== null) {
                        expect(typeof expected[i])
                            .withContext('wrong example order')
                            .toBe(propertyTypes[i]);
                    }
                    else {
                        expect(propertyTypes[i])
                            .withContext('wrong example order')
                            .toBe('null');
                    }
                }
            }
            //#endregion

            for (let i = 0; i < propertyTypes.length; i++) {
                expect(
                    isObject<{ var: any }>({ var: expected[i] }, [
                        ['var', [propertyTypes[i]]]
                    ])
                )
                    .withContext(`correct w/ ${propertyTypes[i]}`)
                    .toBe(true);

                expect(
                    isObject<{ var: any }>({ var: expected[i] }, [
                        ['var', 'any']
                    ])
                )
                    .withContext(`${propertyTypes[i]} w/ any`)
                    .toBe(true);
            }

            expect(isObject<{ var: any }>({}, [['var', 'any']]))
                .withContext('property not present w/ any')
                .toBe(false);
        });

        it('should correctly check object type (array property)', () => {
            const types: ('array' | 'array|null' | 'array|undefined')[] = [
                'array',
                'array|null',
                'array|undefined'
            ];
            const obj: { var: any[] } = { var: ['abc', 123, true] };

            //#region Correct
            for (const type of types) {
                expect(isObject<typeof obj>(obj, [['var', type]]))
                    .withContext(`correct w/ ${type}`)
                    .toBe(true);
            }
            //#endregion

            //#region array | null
            expect(isObject<typeof obj>({ var: null }, [['var', 'array|null']]))
                .withContext('null w/ array|null')
                .toBe(true);
            expect(
                isObject<typeof obj>({ var: undefined }, [
                    ['var', 'array|null']
                ])
            )
                .withContext('undefined w/ array|null')
                .toBe(false);
            expect(isObject<typeof obj>({}, [['var', 'array|null']]))
                .withContext('property not present w/ array|null')
                .toBe(false);
            //#endregion

            //#region array | undefined
            expect(
                isObject<typeof obj>({ var: undefined }, [
                    ['var', 'array|undefined']
                ])
            )
                .withContext('undefined w/ array|undefined')
                .toBe(true);
            expect(isObject<typeof obj>({}, [['var', 'array|undefined']]))
                .withContext('property not present w/ array|undefined')
                .toBe(true);
            expect(
                isObject<typeof obj>({ var: null }, [
                    ['var', 'array|undefined']
                ])
            )
                .withContext('null w/ array|undefined')
                .toBe(false);
            //#endregion
        });

        it('should correctly check object type (property w/ multiple types)', () => {
            type Type<T> = { var: T };
            let list: [{ var?: any }, boolean][];

            //#region string | null
            list = [
                [{ var: 'abc' }, true],
                [{ var: null }, true],
                [{ var: 123 }, false],
                [{}, false]
            ];
            for (const pair of list) {
                const obj = pair[0];
                expect(
                    isObject<Type<string | null>>(obj, [
                        ['var', ['string', 'null']]
                    ])
                )
                    .withContext(
                        `${
                            obj.var === null ? 'null' : typeof obj.var
                        } w/ string|null`
                    )
                    .toBe(pair[1]);
            }
            //#endregion

            //#region number | null | undefined
            list = [
                [{ var: 123 }, true],
                [{ var: null }, true],
                [{ var: undefined }, true],
                [{}, true],
                [{ var: 'abc' }, false]
            ];
            for (const pair of list) {
                const obj = pair[0];
                expect(
                    isObject<Type<number | null | undefined>>(obj, [
                        ['var', ['number', 'null', 'undefined']]
                    ])
                )
                    .withContext(
                        `${
                            obj.var === null ? 'null' : typeof obj.var
                        } w/ number|null|undefined`
                    )
                    .toBe(pair[1]);
            }
            //#endregion

            //#region number | string | null
            list = [
                [{ var: 123 }, true],
                [{ var: 'abc' }, true],
                [{ var: null }, true],
                [
                    {
                        var: {
                            test1: 'abc',
                            test2: 123
                        }
                    },
                    false
                ],
                [{}, false]
            ];
            for (const pair of list) {
                const obj = pair[0];
                expect(
                    isObject<Type<number | string | null>>(obj, [
                        ['var', ['number', 'string', 'null']]
                    ])
                )
                    .withContext(
                        `${
                            obj.var === null ? 'null' : typeof obj.var
                        } w/ number|string|null`
                    )
                    .toBe(pair[1]);
            }
            //#endregion
        });

        it('should correctly check object type (multiple properties & types)', () => {
            // Empty object
            expect(isObject<any>({}, []))
                .withContext('empty object')
                .toBe(true);

            type Type = {
                num: number;
                text?: string;
                parent: { [key: string]: unknown } | null;
                children: string[];
                optChildren?: number[];
            };
            const props: [
                keyof Type,
                typeof propertyTypes[number][] | 'array' | 'array|undefined'
            ][] = [
                ['num', ['number']],
                ['text', ['string', 'undefined']],
                ['parent', ['object', 'null']],
                ['children', 'array'],
                ['optChildren', 'array|undefined']
            ];

            //#region All properties provided
            expect(
                isObject<Type>(
                    {
                        num: 123,
                        text: 'abc',
                        parent: { test1: () => {} },
                        children: ['a', 'b', 'c'],
                        optChildren: [1, 2, 3]
                    },
                    props
                )
            )
                .withContext('all properties provided')
                .toBe(true);
            //#endregion

            //#region Optional properties skipped
            expect(
                isObject<Type>(
                    {
                        num: 123,
                        parent: null,
                        children: [123, 'abc', BigInt(3)]
                    },
                    props
                )
            )
                .withContext('optional properties skipped')
                .toBe(true);
            //#endregion

            //#region Wrong object
            expect(
                isObject<Type>(
                    { num: 'abc', parent: null, children: 123 },
                    props
                )
            )
                .withContext('wrong object')
                .toBe(false);
            //#endregion
        });

        it('should return false (wrong input)', () => {
            //#region No provided types
            expect(isObject<any>({ var: 'abc' }, [['var', []]]))
                .withContext('No provided types')
                .toBe(false);
            //#endregion

            //#region Checking not an object
            expect(isObject<{ var: any }>('abc', [['var', 'any']]))
                .withContext('Checking not an object')
                .toBe(false);
            //#endregion
        });

        it('should return false (null & undefined)', () => {
            expect(isObject<any>(null, [])).toBe(false);
            expect(isObject<any>(undefined, [])).toBe(false);
        });
    });

    describe('removeMathTabIndex', () => {
        const mathClass = 'MathJax';
        let elements: HTMLElement[];

        beforeEach(() => {
            elements = [];
            for (let i = 0; i < 5; i++) {
                const element = document.createElement('p');
                element.tabIndex = 1;
                element.id = i.toString();
                if (i % 2) element.className = mathClass;
                elements.push(element);
            }
            document.querySelectorAll = jasmine
                .createSpy('HTML Elements')
                .and.returnValue(
                    elements.filter(
                        (element) => element.className === mathClass
                    )
                );
        });

        it('should set tabIndex of Math elements to -1', () => {
            removeMathTabIndex();
            for (const element of elements) {
                expect(element.tabIndex)
                    .withContext(element.id)
                    .toBe(element.className === mathClass ? -1 : 1);
            }
        });
    });

    describe('pbkdf2', () => {
        it('should correctly hash', (done: DoneFn) => {
            const counter = new BehaviorSubject<number>(0);

            /**
             * Password, email, expected hashed password
             */
            const list: [string, string, string][] = [
                ['b', 'b@b.bb', 'ZywyW1h4EKLJe/jAjKiDN+eufwV0SOeTIjb2DBMgJqQ='],
                ['1', 'b@b.bb', 'xfDzQivyYi4/DyiVO/d+1DBbR6WXxBe2v2xGVx0k5Lw='],
                [
                    'secret',
                    'admin',
                    'u/+1fh/AmmWzro+YA7khgk1L5VfYoABocupuT41i+AA='
                ]
            ];

            counter.subscribe((count) => {
                if (count === list.length) done();
            });

            for (const [password, email, hash] of list) {
                pbkdf2(email, password)
                    .then((val) => {
                        expect(val).toBe(hash);
                        counter.next(counter.getValue() + 1);
                    })
                    .catch(() => done.fail());
            }
        }, 8000);

        it('should correctly hash (w/ params)', (done: DoneFn) => {
            const counter = new BehaviorSubject(0);
            const list: [string, string, number, number, string, string][] = [
                ['secret', 'salt', 512, 64, 'SHA-512', '1YqXX+X2PNg=']
            ];

            counter.subscribe((count) => {
                if (count === list.length) done();
            });

            for (const [password, email, iter, keylen, digest, hash] of list) {
                pbkdf2(email, password, iter, keylen, digest)
                    .then((val) => {
                        expect(val).toBe(hash);
                        counter.next(counter.getValue() + 1);
                    })
                    .catch(() => done.fail());
            }
        });
    });

    describe('getErrorCode', () => {
        it('should extract error code', () => {
            expect(getErrorCode({ status: 404 })).toBe(404);
            expect(getErrorCode({ status: 401 }, 500)).toBe(401);
        });

        it('should return default fallback', () => {
            const defCode = INTERNAL_ERROR;
            expect(getErrorCode({})).toBe(defCode);
            expect(getErrorCode({}, undefined)).toBe(defCode);
            expect(getErrorCode({ abc: 404 })).toBe(defCode);
        });

        it('should return provided fallback', () => {
            expect(getErrorCode({}, 500)).toBe(500);
            expect(getErrorCode({ error: 400 }, 401)).toBe(401);
        });
    });

    describe('replaceAccents', () => {
        it('should replace diacritics', () => {
            const list: [string, string][] = [
                ['pociągi dwa', 'pociagi dwa'],
                ['pociagi-dwa', 'pociagi-dwa'],
                ['póĆíägî\u00a0\u00a0ĐwÃ', 'poCiagi  ĐwA'],
                ['zażółć gęślą jaźń', 'zazolc gesla jazn']
            ];
            for (const [input, result] of list) {
                const replaced = replaceAccents(input);
                expect(replaced)
                    .withContext(
                        `Expected '${encodeURIComponent(
                            replaced
                        )}' to be '${encodeURIComponent(result)}'`
                    )
                    .toBe(result);
            }
        });
    });
});
