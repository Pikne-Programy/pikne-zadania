import { Component, HostBinding, Input } from '@angular/core';
import { Tuple } from 'src/app/helper/utils';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  host: { class: 'panel is-flex is-flex-direction-column unscrollable' },
})
export class PanelComponent {
  @Input('main-link') mainLink?: string;
  /**
   * First - Text; Second - link; Third - icon
   */
  @Input('items') list!: Tuple<string, string, string | undefined>[];
  @Input() header?: string;
  @Input() color?: string;
  @Input('loading') isLoading?: boolean;

  @HostBinding('class') get class() {
    return this.getColor();
  }
  constructor() {}

  getRouterLink(itemLink: string) {
    return this.mainLink ? [this.mainLink, itemLink] : [itemLink];
  }

  getColor(): string {
    return this.color ? `is-${this.color.toLowerCase()}` : '';
  }
}
