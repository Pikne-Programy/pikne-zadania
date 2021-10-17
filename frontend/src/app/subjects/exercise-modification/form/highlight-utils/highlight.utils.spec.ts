/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { createRange, createUnknown, createVariable } from './highlight.utils';

describe('Exercise editor Highlighting Utils', () => {
    const name = 'a';
    const unit = 'km';

    describe('createVariable', () => {
        const value = '123';

        it('should create variable', () => {
            expect(createVariable(name, value)).toBe(`${name}=${value}`);
        });

        it('should create variable w/ unit', () => {
            expect(createVariable(name, value, unit)).toBe(
                `${name}=${value}${unit}`
            );
        });
    });

    describe('createRange', () => {
        const start = '1';
        const end = '5';
        const step = '2';

        it('should create range', () => {
            expect(createRange(name, start, end)).toBe(
                `${name}=[${start};${end}]`
            );
        });

        it('should create range w/ step', () => {
            expect(createRange(name, start, end, step)).toBe(
                `${name}=[${start};${end};${step}]`
            );
        });

        it('should create range w/ unit', () => {
            expect(createRange(name, start, end, undefined, unit)).toBe(
                `${name}=[${start};${end}]${unit}`
            );
        });

        it('should create range w/ step & unit', () => {
            expect(createRange(name, start, end, step, unit)).toBe(
                `${name}=[${start};${end};${step}]${unit}`
            );
        });
    });

    describe('createUnknown', () => {
        it('should create variable', () => {
            expect(createUnknown(name)).toBe(`${name}=?`);
        });

        it('should create variable w/ unit', () => {
            expect(createUnknown(name, unit)).toBe(`${name}=?${unit}`);
        });
    });
});
