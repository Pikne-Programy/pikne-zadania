import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-unsaved-changes-modal',
    templateUrl: './unsaved-changes-modal.component.html',
    styleUrls: ['./unsaved-changes-modal.component.scss']
})
export class UnsavedChangesModalComponent {
    @Input() open!: boolean;
    @Output() onSubmit = new EventEmitter();
    @Output() onDiscard = new EventEmitter();
    @Output() onCancel = new EventEmitter();
}
