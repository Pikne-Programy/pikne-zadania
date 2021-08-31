import {
    Component,
    EventEmitter,
    HostBinding,
    Input,
    Output
} from '@angular/core';

@Component({
    selector: 'app-card-modal',
    templateUrl: './card-modal.component.html',
    styleUrls: ['./card-modal.component.scss']
})
export class CardModalComponent {
    @Input() open!: boolean;
    @Input() title!: string;
    @Output() onClose = new EventEmitter();
    @Input() hasList?: boolean;
    /**
     * Increases top margin to compensate for navbar
     *
     * True by default
     */
    @Input() hasNavbarMargin?: boolean;

    @HostBinding('class') get class() {
        return `modal ${this.open ? 'is-active' : ''} ${
            this.hasNavbarMargin !== false ? 'has-navbar' : ''
        }`;
    }
    constructor() {}

    closeModal() {
        this.onClose.emit();
    }
}
