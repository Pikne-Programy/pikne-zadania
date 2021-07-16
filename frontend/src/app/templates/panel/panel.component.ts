import { LowerCasePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';

export type TextPipe = 'uppercase' | 'lowercase' | 'titlecase';

export type PanelItem = [string, string, string | undefined];
export type SpecialPanelItem = [
  string,
  string,
  string | undefined,
  boolean,
  boolean
];
function convertToSpecial(
  item: PanelItem | SpecialPanelItem
): SpecialPanelItem {
  return item.length === 3 ? [item[0], item[1], item[2], false, false] : item;
}

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  host: { class: 'panel is-flex is-flex-direction-column unscrollable' },
})
export class PanelComponent {
  @Input('main-link') mainLink?: string;
  /**
   * Single list of items shown in the panel (overrides *Tabs*). \
   * Forth & Fifth are optional and define if element has prefix/suffix (which has to be provided as Templates in ***ng-template*** with references in *prefix* & *suffix* fields)
   *
   * First - Text; Second - link; Third - icon; Forth *(optional)* - has prefix; Fifth *(optional)* - has suffix
   *
   * @see {@link PanelItem}
   * @see {@link SpecialPanelItem}
   *
   * @example <caption>HTML with Prefix & Suffix</caption>
   * <app-select ...other properties... [prefix]="prefixView" [suffix]="suffixView"></app-select>
   * <ng-template #prefixView>
   *   <div>Prefix</div>
   * </ng-template>
   * <ng-template #suffixView>
   *   <div>Suffix</div>
   * </ng-template>
   */
  @Input('items') list?: PanelItem[] | SpecialPanelItem[];
  /**
   * Multiple item lists, each associated with one tab
   *
   * First - Tab text; Second - Item list (see *Items*)
   */
  @Input() tabs?: [string, PanelItem[] | SpecialPanelItem[]][];
  @Input() header?: string;
  @Input() color?: string;
  /**
   * Index of currently selected tab
   */
  @Input('selected-tab') currentTab?: number;
  @Output() onTabClick = new EventEmitter<number>();
  @Input('loading') isLoading?: boolean;
  @Input('text-pipe') pipe?: TextPipe;
  @Input() prefix?: TemplateRef<any>;
  @Input() suffix?: TemplateRef<any>;

  @HostBinding('class') get class() {
    return this.getColor();
  }
  constructor() {}

  /**
   * First - Text; Second - link; Third - icon; Forth - has prefix; Fifth - has suffix
   * @see {@link SpecialPanelItem}
   */
  getItems(): SpecialPanelItem[] {
    const res: SpecialPanelItem[] = [];
    if (this.list) {
      for (const item of this.list) res.push(convertToSpecial(item));
      return res;
    } else if (!this.tabs || this.tabs.length < 1) return [];
    else {
      for (const item of this.tabs[this.getCurrentTab(this.tabs.length)][1])
        res.push(convertToSpecial(item));
      return res;
    }
  }

  getTabs(): string[] | undefined {
    if (this.list || !this.tabs || this.tabs.length < 1) return undefined;
    else return this.tabs.map((val) => val[0]);
  }

  getCurrentTab(tabListLength: number): number {
    if (
      this.currentTab === undefined ||
      this.currentTab < 0 ||
      this.currentTab >= tabListLength
    )
      return 0;
    else return this.currentTab;
  }

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
