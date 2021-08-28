import { Injectable } from '@angular/core';
import { InputButton } from '../editor-toolbar/editor-toolbar.component';

export enum SnippetType {
  LATEX,
  FUNCTION,
  TRIGONOMETRY,
  VARIABLE,
  RANGE,
  UNKNOWN,
}

@Injectable({
  providedIn: 'root',
})
export class SnippetService {
  private _currentSnippet: SnippetType | null = null;
  get currentSnippet() {
    return this._currentSnippet;
  }

  constructor() {}

  openSnippet(action: SnippetType, button?: InputButton) {
    if (this._currentSnippet === action) this.closeSnippet();
    else {
      this._currentSnippet = action;
      if (button) button.clearFields();
    }
  }

  closeSnippet() {
    this._currentSnippet = null;
  }
}
