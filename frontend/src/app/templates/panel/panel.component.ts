import { LowerCasePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, HostBinding, Input } from '@angular/core';

export type TextPipe = 'uppercase' | 'lowercase' | 'titlecase';

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
  @Input('items') list!: [string, string, string | undefined][];
  @Input() header?: string;
  @Input() color?: string;
  @Input('loading') isLoading?: boolean;
  @Input('text-pipe') pipe?: TextPipe;

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

  getPipedText(text: string): string {
    switch (this.pipe) {
      case 'uppercase':
        return new UpperCasePipe().transform(text);
      case 'lowercase':
        return new LowerCasePipe().transform(text);
      case 'titlecase':
        return new TitleCasePipe().transform(text);
      default:
        return text;
    }
  }
}
