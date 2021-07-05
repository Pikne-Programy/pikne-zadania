import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import {
  PanelItem,
  SpecialPanelItem,
  TextPipe,
} from '../panel/panel.component';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  host: { class: 'section' },
})
export class SelectComponent {
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
  @Input() items?: PanelItem[] | SpecialPanelItem[];
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
