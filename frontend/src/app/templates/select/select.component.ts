import { Component, Input } from '@angular/core';
import { Tuple } from 'src/app/helper/utils';

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
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
  @Input('is-outer-loading') isOuter?: boolean;

  @Input('error-message') errorMessage?: string;
  @Input('error-code') errorCode!: number | null;
  /**
   * Array with 2 elements: first - text, second - link.
   *
   * Uses default if null
   */
  @Input('error-link') errorLink?: string[] | null;

  constructor() {}
}
