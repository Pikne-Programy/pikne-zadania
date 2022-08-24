import { TestBed, inject } from '@angular/core/testing';
import { InputButton } from '../editor-toolbar/editor-toolbar.component';
import { SnippetService, SnippetType } from './snippet.service';

describe('Service: Snippet', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [SnippetService]
        });
    });

    describe('openSnippet', () => {
        it('should open snippet', inject(
            [SnippetService],
            (service: SnippetService) => {
                expect(service).toBeTruthy();
                expect(service.currentSnippet).toBeNull();

                const list = [
                    SnippetType.LATEX,
                    SnippetType.FUNCTION,
                    SnippetType.TRIGONOMETRY,
                    SnippetType.VARIABLE,
                    SnippetType.RANGE,
                    SnippetType.UNKNOWN
                ];
                for (const snippet of list) {
                    service.openSnippet(snippet);
                    expect(service.currentSnippet)
                        .withContext(SnippetType[snippet])
                        .toBe(snippet);
                }
            }
        ));

        it('should open snippet w/ InputButton', inject(
            [SnippetService],
            (service: SnippetService) => {
                const snippet = SnippetType.UNKNOWN;
                const button = new InputButton('label', 'icon', snippet, []);
                const buttonSpy = spyOn(button, 'clearFields');
                expect(service).toBeTruthy();
                expect(service.currentSnippet).toBeNull();

                service.openSnippet(snippet, button);
                expect(service.currentSnippet).toBe(snippet);
                expect(buttonSpy).toHaveBeenCalledWith();
            }
        ));

        it('should close snippet', inject(
            [SnippetService],
            (service: SnippetService) => {
                const snippet = SnippetType.FUNCTION;
                (service as any)._currentSnippet = snippet;
                expect(service).toBeTruthy();

                service.openSnippet(snippet);
                expect(service.currentSnippet).toBeNull();
            }
        ));
    });

    describe('closeSnippet', () => {
        it('should close snippet', inject(
            [SnippetService],
            (service: SnippetService) => {
                (service as any)._currentSnippet = SnippetType.FUNCTION;
                expect(service).toBeTruthy();

                service.closeSnippet();
                expect(service.currentSnippet).toBeNull();
            }
        ));
    });
});
