import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-card-modal',
  templateUrl: './card-modal.component.html',
  styleUrls: ['./card-modal.component.scss'],
  host: { class: 'modal' },
})
export class CardModalComponent {
  @Input() open!: boolean;
  @Input() title!: string;
  @Output('onClose') close = new EventEmitter();
  @Input('has-list') hasList?: boolean;
  /**
   * Increases top margin to compensate for navbar
   *
   * True by default
   */
  @Input('navbar-margin') navbar?: boolean;

  @HostBinding('class') get class() {
    return (
      (this.open ? 'is-active' : '') +
      (this.navbar === false ? '' : ' has-navbar')
    );
  }
  constructor() {}

  closeModal() {
    this.close.emit();
  }
}
