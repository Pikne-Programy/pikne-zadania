import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';

//TODO More themes
export type Theme = 'default' | 'dark' | 'dark-red';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  setTheme(name: Theme) {
    this.document
      .getElementById('theme')
      ?.setAttribute('href', `${name === 'default' ? 'styles' : name}.css`);
  }

  resetTheme() {
    this.setTheme('default');
  }
}
