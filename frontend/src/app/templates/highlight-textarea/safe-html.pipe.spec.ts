import { inject, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeHtmlPipe } from './safe-html.pipe';

describe('Pipe: SafeHtml', () => {
    const sanitizerMock = {
        bypassSecurityTrustHtml: (value: string) => `Safe: ${value}`
    };
    const html = 'This is a <b><i>SAFE</i></b> HTML.';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: DomSanitizer, useValue: sanitizerMock }]
        });
    });

    it('should create an instance', inject(
        [DomSanitizer],
        (sanitizer: DomSanitizer) => {
            const pipe = new SafeHtmlPipe(sanitizer);
            expect(pipe).toBeTruthy();
        }
    ));

    it('should transform html', inject(
        [DomSanitizer],
        (sanitizer: DomSanitizer) => {
            const pipe = new SafeHtmlPipe(sanitizer);
            expect(pipe).toBeTruthy();
            const spy = spyOn(sanitizer, 'bypassSecurityTrustHtml').and.callThrough();

            expect(typeof pipe.transform(html)).toBe('string');
            expect(spy).toHaveBeenCalledWith(html);
        }
    ));

    it(`should escape '<'`, () => {
        expect(SafeHtmlPipe.escape(html)).toBe(html.replace(/</g, '&lt;'));
    });
});
