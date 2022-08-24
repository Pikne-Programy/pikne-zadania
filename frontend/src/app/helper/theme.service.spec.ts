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

    it('should recognize dark themes', () => {
        for (const theme of themes) {
            switch (theme) {
                case 'default':
                    expect(ThemeService.isDarkTheme(theme)).toBeFalse();
                    break;
                case 'dark':
                case 'dark-red':
                    expect(ThemeService.isDarkTheme(theme)).toBeTrue();
                    break;
            }
        }
    });

    it('should return default theme', inject(
        [ThemeService],
        (service: ThemeService) => {
            spyOn(themes, 'find').and.returnValue(undefined);
            expect(service).toBeTruthy();

            const stylesheet = 'dark.css';
            const dummy = createThemeElement();
            document.getElementById = jasmine
                .createSpy('HTML Element')
                .and.returnValue(dummy);
            dummy.href = stylesheet;

            expect((service as any).getTheme(stylesheet)).toBe('default');
        }
    ));
});

function createThemeElement(): HTMLLinkElement {
    const dummy = document.createElement('link');
    dummy.id = 'theme';
    dummy.rel = 'stylesheet';
    dummy.href = 'styles.css';
    return dummy;
}
