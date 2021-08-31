/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { TestBed, inject } from '@angular/core/testing';
import { themes, ThemeService } from './theme.service';

describe('Service: Theme', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ThemeService]
        });
    });

    it('should set theme', inject([ThemeService], (service: ThemeService) => {
        expect(service).toBeTruthy();

        const dummy = createThemeElement();
        document.getElementById = jasmine
            .createSpy('HTML Element')
            .and.returnValue(dummy);

        for (const theme of themes) {
            service.setTheme(theme);
            expect(document.getElementById('theme')?.getAttribute('href')).toBe(
                `${theme === 'default' ? 'styles' : theme}.css`
            );
        }
    }));

    it('should reset theme', inject([ThemeService], (service: ThemeService) => {
        expect(service).toBeTruthy();

        const dummy = createThemeElement();
        document.getElementById = jasmine
            .createSpy('HTML Element')
            .and.returnValue(dummy);

        service.resetTheme();
        expect(document.getElementById('theme')?.getAttribute('href')).toBe(
            'styles.css'
        );
    }));
});

function createThemeElement(): HTMLLinkElement {
    const dummy = document.createElement('link');
    dummy.id = 'theme';
    dummy.rel = 'stylesheet';
    dummy.href = 'styles.css';
    return dummy;
}
