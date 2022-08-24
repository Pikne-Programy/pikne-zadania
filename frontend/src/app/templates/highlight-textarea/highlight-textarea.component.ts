import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/helper/theme.service';
import { SafeHtmlPipe } from './safe-html.pipe';

@Component({
    selector: 'app-highlight-textarea',
    templateUrl: './highlight-textarea.component.html',
    styleUrls: ['./highlight-textarea.component.scss']
})
export class HighlightTextareaComponent
implements OnInit, AfterViewInit, OnDestroy {
    /**
     * First - search RegEx; Second - background color; Third - background color for dark theme
     */
    @Input() toHighlight!: [RegExp, string, string][];
    @Input() form!: FormGroup;
    @Input() controlName!: string;
    @Output() onInput = new EventEmitter();

    @Input() hasToolbar?: boolean;
    @Input() isFocused?: boolean;
    @Output() isFocusedChange = new EventEmitter<boolean>();
    @Input() isToolbarFocused?: boolean;

    private isDark = false;
    private contentAttrs: string;

    get control() {
        return this.form.get(this.controlName)! as FormControl;
    }

    @ViewChild('backdrop') $backdrop!: ElementRef<HTMLDivElement>;
    @ViewChild('textarea') $textarea!: ElementRef<HTMLTextAreaElement>;
    private theme$?: Subscription;
    private isComponentReady = false;
    constructor(
        hostRef: ElementRef<HTMLElement>,
        private themeService: ThemeService
    ) {
        this.contentAttrs = this.getContentAttrs(hostRef);
    }

    ngOnInit() {
        this.theme$ = this.themeService.themeChange.subscribe(
            (theme) => (this.isDark = ThemeService.isDarkTheme(theme))
        );
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.isComponentReady = true;
        }, 20);
    }

    get textarea() {
        return this.$textarea;
    }

    get highlightedText() {
        return this.applyHighLights(this.control.value);
    }

    private applyHighLights(text: string) {
        text = SafeHtmlPipe.escape(text.replace(/\n$/, '\n&nbsp;'));
        if (this.isComponentReady) text = this.setSelection(text);
        for (const [searchValue, backgroundColor, darkBackgroundColor] of this
            .toHighlight) {
            text = text.replace(
                searchValue,
                `<mark style="background-color: ${
                    this.isDark ? darkBackgroundColor : backgroundColor
                };" ${this.contentAttrs}>$&</mark>`
            );
        }
        return text;
    }

    private setSelection(text: string): string {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.$textarea && !this.isFocused && this.isToolbarFocused) {
            const selectionStart = this.$textarea.nativeElement.selectionStart;
            const selectionEnd = this.$textarea.nativeElement.selectionEnd;
            if (selectionStart !== selectionEnd) {
                const pre = text.slice(0, selectionStart);
                const inside = text.slice(selectionStart, selectionEnd);
                const post = text.slice(selectionEnd);

                return `${pre}<mark class="selection" ${this.contentAttrs}>${inside}</mark>${post}`;
            }
            else {
                const pre = text.slice(0, selectionStart);
                const post = text.slice(selectionEnd);

                return `${pre}<mark class="cursor" ${this.contentAttrs}></mark>${post}`;
            }
        }
        return text;
    }

    scroll() {
        const scrollTop = this.$textarea.nativeElement.scrollTop;
        this.$backdrop.nativeElement.scrollTop = scrollTop;

        const scrollLeft = this.$textarea.nativeElement.scrollLeft;
        this.$backdrop.nativeElement.scrollLeft = scrollLeft;
    }

    private getContentAttrs(hostRef: ElementRef<HTMLElement>): string {
        const attrs = hostRef.nativeElement.attributes;
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name.startsWith('_nghost-'))
                return `_ngcontent-${attrs[i].name.substring(8)}=""`;
        }
        return '';
    }

    /* istanbul ignore next */
    ngOnDestroy() {
        this.theme$?.unsubscribe();
    }
}
