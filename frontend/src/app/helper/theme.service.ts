import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

//TODO More themes
export const themes = ['default', 'dark', 'dark-red'] as const;
export type Theme = typeof themes[number];

@Injectable({
    providedIn: 'root'
})
export class ThemeService implements OnDestroy {
    private static readonly DarkThemes = new Set<Theme>(['dark', 'dark-red']);

    static isDarkTheme(name: Theme): boolean {
        return this.DarkThemes.has(name);
    }

    themeChange: BehaviorSubject<Theme>;
    constructor(@Inject(DOCUMENT) private document: Document) {
        const stylesheet = this.document
            .getElementById('theme')
            ?.getAttribute('href');
        this.themeChange = new BehaviorSubject(this.getTheme(stylesheet));
    }

    setTheme(name: Theme) {
        const element = this.document.getElementById('theme');
        if (element) {
            element.setAttribute('href', this.getStylesheet(name));
            this.themeChange.next(name);
        }
    }

    resetTheme() {
        this.setTheme('default');
    }

    private getTheme(stylesheet: string | null | undefined): Theme {
        if (!stylesheet)
            return 'default';

        const name = stylesheet
            .replace(/.css$/g, '')
            .replace('styles', 'default');
        return themes.find((theme) => theme === name) ?? 'default';
    }
    private getStylesheet(theme: string): string {
        return `${theme === 'default' ? 'styles' : theme}.css`;
    }

    ngOnDestroy() {
        this.themeChange.complete();
    }
}
