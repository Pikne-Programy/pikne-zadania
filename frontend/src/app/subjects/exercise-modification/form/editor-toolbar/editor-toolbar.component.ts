import {
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ScreenSizes,
  ScreenSizeService,
} from 'src/app/helper/screen-size.service';
import * as Utils from '../highlight-utils/highlight.utils';
import {
  SnippetService,
  SnippetType,
} from '../snippet.service/snippet.service';
const BRACKETS_SVG_PATH =
  'M144 32H32A32 32 0 0 0 0 64v384a32 32 0 0 0 32 32h112a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16H64V96h80a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zm272 0H304a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h80v320h-80a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h112a32 32 0 0 0 32-32V64a32 32 0 0 0-32-32z';
const SINE_SVG_PATH =
  'M464 480c-90.52 0-132.84-107.94-173.8-212.31C258.64 187.2 222.88 96 176 96c-39.7 0-91.38 81.89-114.12 149a16 16 0 0 1-19.74 10.33l-30.72-9.21A16 16 0 0 1 .84 225.68C19.55 169.79 82.16 32 176 32c90.52 0 132.84 107.94 173.8 212.31C381.36 324.8 417.12 416 464 416c39.7 0 91.38-81.89 114.12-149a16 16 0 0 1 19.74-10.33l30.72 9.21a16 16 0 0 1 10.58 20.43C620.45 342.21 557.84 480 464 480z';

class Button {
  constructor(
    public label: string,
    public icon: string,
    public action: SnippetType,
    private _viewBox?: [number, number],
    public isText?: boolean
  ) {}

  get isSvg() {
    return this._viewBox !== undefined;
  }

  get viewBox() {
    return this._viewBox ? `0 0 ${this._viewBox[0]} ${this._viewBox[1]}` : '';
  }

  hasLabel(targetScreenSize: ScreenSizes, currentScreenSize?: ScreenSizes) {
    return (
      currentScreenSize === undefined || currentScreenSize > targetScreenSize
    );
  }

  getTitle(targetScreenSize: ScreenSizes, screenSize?: ScreenSizes) {
    return !this.hasLabel(targetScreenSize, screenSize) ? this.label : '';
  }
}

class ListButton extends Button {
  constructor(
    label: string,
    icon: string,
    action: SnippetType,
    public options: string[],
    _viewBox?: [number, number],
    isText?: boolean
  ) {
    super(label, icon, action, _viewBox, isText);
  }
}

export class InputButton extends Button {
  public fields: InputButtonField[];

  constructor(
    label: string,
    icon: string,
    action: SnippetType,
    fields: [string, Utils.InputType, boolean][],
    _viewBox?: [number, number],
    isText?: boolean
  ) {
    super(label, icon, action, _viewBox, isText);
    this.fields = fields.map(
      ([name, type, isRequired]) => new InputButtonField(name, type, isRequired)
    );
  }

  isValid() {
    return this.fields.every((field) => field.isValid());
  }

  clearFields() {
    this.fields.forEach((field) => (field.value = ''));
  }
}

class InputButtonField {
  public value: string = '';

  constructor(
    public name: string,
    public type: Utils.InputType,
    public isRequired: boolean
  ) {}

  isValid(): boolean | null {
    if (this.value.length === 0) return this.isRequired ? null : true;
    return Utils.InputTypesMap[this.type].test(this.value);
  }
}

interface SlicedText {
  pre: string;
  inside: string;
  post: string;

  selectionStart: number;
  selectionEnd: number;
}

@Component({
  selector: 'app-editor-toolbar',
  templateUrl: './editor-toolbar.component.html',
  styleUrls: ['./editor-toolbar.component.scss'],
})
export class EditorToolbarComponent implements OnInit, OnDestroy {
  @Input() isStandalone?: boolean;
  @Input() isHighlightingEnabled!: boolean;
  @Input('input') formControl!: AbstractControl;
  @Output() toggleHighlighting = new EventEmitter();

  @Input() isFocused?: boolean;
  @Output() isFocusedChange = new EventEmitter<boolean>();

  @Input() textarea!: ElementRef<HTMLTextAreaElement> | null;
  private selection: [number, number] | null = null;

  screenSize?: ScreenSizes;
  readonly buttons: [Button[], ScreenSizes][] = [
    [
      [
        new Button('LaTeX', 'L', SnippetType.LATEX, undefined, true),
        new ListButton(
          'Funkcje',
          'fa-square-root-alt',
          SnippetType.FUNCTION,
          Utils.functions
        ),
        new ListButton(
          'Trygonometria',
          SINE_SVG_PATH,
          SnippetType.TRIGONOMETRY,
          Utils.trigonometry,
          [640, 512]
        ),
      ],
      ScreenSizes.DESKTOP,
    ],
    [
      [
        new InputButton('Zmienna', 'fa-equals', SnippetType.VARIABLE, [
          ['Nazwa', 'variable', true],
          ['Wartość', 'number', true],
          ['Jednostka', 'unit', false],
        ]),
        new InputButton(
          'Przedział',
          BRACKETS_SVG_PATH,
          SnippetType.RANGE,
          [
            ['Nazwa', 'variable', true],
            ['Początek', 'number', true],
            ['Koniec', 'number', true],
            ['Krok', 'number', false],
            ['Jednostka', 'unit', false],
          ],
          [448, 512]
        ),
        new InputButton('Niewiadoma', 'fa-question', SnippetType.UNKNOWN, [
          ['Nazwa', 'variable', true],
          ['Jednostka', 'unit', false],
        ]),
      ],
      ScreenSizes.TABLET,
    ],
  ];

  @HostBinding('class') get class() {
    return this.isStandalone ? '' : 'is-connected';
  }
  private screenSize$?: Subscription;
  constructor(
    private screenSizeService: ScreenSizeService,
    public snippetService: SnippetService
  ) {}

  ngOnInit() {
    this.screenSize$ = this.screenSizeService.currentSize.subscribe(
      (size) => (this.screenSize = size)
    );
  }

  isListButton(button: Button): button is ListButton {
    return button instanceof ListButton;
  }

  isInputButton(button: Button): button is InputButton {
    return button instanceof InputButton;
  }

  executeButtonAction(button: Button) {
    if (this.textarea) {
      this.selection = [
        this.textarea.nativeElement.selectionStart,
        this.textarea.nativeElement.selectionEnd,
      ];
      this.textarea.nativeElement.setSelectionRange(
        this.selection[0],
        this.selection[1]
      );
    }

    switch (button.action) {
      case SnippetType.LATEX:
        this.addLaTeX();
        break;
      default:
        if (this.isInputButton(button))
          this.snippetService.openSnippet(button.action, button);
        else this.snippetService.openSnippet(button.action);
    }
  }

  confirmSnippet(button: InputButton) {
    const values = button.fields.map((field) => field.value);
    switch (button.action) {
      case SnippetType.VARIABLE:
        this.addVariable(values);
        break;
      case SnippetType.RANGE:
        this.addRange(values);
        break;
      case SnippetType.UNKNOWN:
        this.addUnknown(values);
        break;
    }
    this.selection = null;
    this.snippetService.closeSnippet();
  }

  addLaTeX() {
    const sliced = this.sliceText();
    if (sliced) {
      this.formControl.setValue(
        `${sliced.pre}\\(${sliced.inside}\\)${sliced.post}`
      );
      this.updateTextarea(sliced.selectionStart, sliced.selectionEnd, 2);
    }
    this.snippetService.closeSnippet();
    this.selection = null;
  }

  addFunctionOrTrigonometry(func: string) {
    const sliced = this.sliceText();
    if (sliced) {
      this.formControl.setValue(
        `${sliced.pre}${func}(${sliced.inside})${sliced.post}`
      );
      this.updateTextarea(
        sliced.selectionStart,
        sliced.selectionEnd,
        func.length + 1
      );
    }
    this.snippetService.closeSnippet();
    this.selection = null;
  }

  private addVariable(values: string[]) {
    const sliced = this.sliceText();
    if (values.length === 3 && sliced) {
      const variable = Utils.createVariable(values[0], values[1], values[2]);
      this.formControl.setValue(sliced.pre + variable + sliced.post);
      if (sliced.selectionStart !== sliced.selectionEnd) {
        this.updateTextarea(
          sliced.pre.length,
          sliced.pre.length + variable.length
        );
      } else this.updateTextarea(sliced.pre.length + variable.length, null);
    }
  }

  private addRange(values: string[]) {
    const sliced = this.sliceText();
    if (values.length === 5 && sliced) {
      const step = values[3].length > 0 ? values[3] : undefined;
      const range = Utils.createRange(
        values[0],
        values[1],
        values[2],
        step,
        values[4]
      );
      this.formControl.setValue(sliced.pre + range + sliced.post);
      if (sliced.selectionStart !== sliced.selectionEnd) {
        this.updateTextarea(
          sliced.pre.length,
          sliced.pre.length + range.length
        );
      } else this.updateTextarea(sliced.pre.length + range.length, null);
    }
  }

  private addUnknown(values: string[]) {
    const sliced = this.sliceText();
    if (values.length === 2 && sliced) {
      const unknown = Utils.createUnknown(values[0], values[1]);
      this.formControl.setValue(sliced.pre + unknown + sliced.post);
      if (sliced.selectionStart !== sliced.selectionEnd) {
        this.updateTextarea(
          sliced.pre.length,
          sliced.pre.length + unknown.length
        );
      } else this.updateTextarea(sliced.pre.length + unknown.length, null);
    }
  }

  private sliceText(): SlicedText | null {
    if (this.selection) {
      const value = this.formControl.value as string;
      const selectionStart = this.selection[0];
      const selectionEnd = this.selection[1];

      return {
        pre: value.slice(0, selectionStart),
        inside: value.slice(selectionStart, selectionEnd),
        post: value.slice(selectionEnd),
        selectionStart,
        selectionEnd,
      };
    } else return null;
  }

  private updateTextarea(
    selectionStart: number,
    selectionEnd: number | null,
    modifier: number = 0
  ) {
    if (this.textarea) {
      this.textarea.nativeElement.focus();
      this.textarea.nativeElement.setSelectionRange(
        selectionStart + modifier,
        (selectionEnd ?? selectionStart) + modifier
      );
    }
    this.formControl.updateValueAndValidity();
  }

  ngOnDestroy() {
    this.screenSize$?.unsubscribe();
  }
}
