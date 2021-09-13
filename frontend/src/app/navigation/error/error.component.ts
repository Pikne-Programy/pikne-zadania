import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent {
    //#region Error codes
    private readonly UNAUTHORIZED_ERROR = 401;
    private readonly FORBIDDEN_ERROR = 403;
    private readonly NOT_FOUND_ERROR = 404;
    private readonly SERVER_ERROR = 500;
    //#endregion

    readonly defaultMessage = 'Ups, coś poszło nie tak!';
    readonly defaultLink = ['Powrót do wyboru przedmiotu', '/public-exercises'];

    @Input() code?: number;
    @Input() message?: string;
    /**
     * Array with 2 elements: first - text, second - link.
     *
     * Uses default if null
     */
    @Input() link?: string[] | null;
    constructor() {}

    getMessage(): string {
        if (this.message) return this.message;
        switch (this.code) {
            case this.UNAUTHORIZED_ERROR:
            case this.FORBIDDEN_ERROR:
                return 'Nie masz dostępu do tego, czego szukasz!';
            case this.NOT_FOUND_ERROR:
                return 'To, czego szukasz, nie istnieje!';
            case this.SERVER_ERROR:
                return 'Wystąpił błąd serwera';
            default:
                return this.defaultMessage;
        }
    }
}
