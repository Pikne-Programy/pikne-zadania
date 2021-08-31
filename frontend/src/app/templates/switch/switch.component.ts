import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-switch',
    templateUrl: './switch.component.html',
    styleUrls: ['./switch.component.scss']
})
export class SwitchComponent {
    @Input() label?: string;
    @Input() hasLabelRight?: boolean;
    @Input() checked!: boolean;
    @Output() onChange = new EventEmitter();

    @Output() onFocus = new EventEmitter();
    @Output() onFocusOut = new EventEmitter();

    @Input() cssClass?: string;
    get class() {
        return this.cssClass ?? '';
    }

    constructor() {}
}
