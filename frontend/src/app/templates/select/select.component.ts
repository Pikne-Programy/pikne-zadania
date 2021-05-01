import { Component, HostBinding, Input } from '@angular/core';
import { Tuple } from 'src/app/helper/utils';
import { TextPipe } from '../panel/panel.component';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  host: { class: 'section' },
})
export class SelectComponent {
  @Input('main-link') mainLink?: string;
  /**
   * First - Text; Second - link; Third - icon
   */
  @Input() items!: Tuple<string, string, string | undefined>[];
  @Input() header?: string;
  @Input() color?: string;
  @Input('loading') isLoading?: boolean;
  @Input('text-pipe') pipe?: TextPipe;
  /**
   * Adds appropriate padding
   *
   * True by default
   */
  @Input('is-root') isRoot?: boolean;

  @HostBinding('class') get class() {
    return this.isRoot !== false ? 'is-root' : '';
  }
  constructor() {}
}
