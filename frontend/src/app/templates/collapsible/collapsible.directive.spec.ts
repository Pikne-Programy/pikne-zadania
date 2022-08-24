/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { CollapsibleDirective } from './collapsible.directive';

describe('Directive: Collapsible', () => {
    it('should create an instance', () => {
        const directive = new CollapsibleDirective();
        expect(directive).toBeTruthy();

        expect(directive.isCollapsed).toBeTrue();
    });

    it('should be collapsed', () => {
        const directive = new CollapsibleDirective();
        directive.isCollapsed = true;
        expect(directive).toBeTruthy();

        expect(directive.isCollapsed).toBeTrue();
        expect(directive.class.trim()).toBe('collapsible is-collapsed');
    });

    it('should not be collapsed', () => {
        const directive = new CollapsibleDirective();
        directive.isCollapsed = false;
        expect(directive).toBeTruthy();

        expect(directive.isCollapsed).toBeFalse();
        expect(directive.class.trim()).toBe('collapsible');
    });
});
