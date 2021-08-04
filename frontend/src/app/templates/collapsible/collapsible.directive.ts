import { Directive, HostBinding, Input } from '@angular/core';

@Directive({
  selector: '[appCollapsible]',
  host: { class: 'collapsible' },
})
export class CollapsibleDirective {
  /**
   * Directive that applies necessary styles & logic for an element to become collapsible
   *
   * Value represents if element is collapsed
   */
  @Input('appCollapsible') isCollapsed = true;

  @HostBinding('class') get class() {
    return this.isCollapsed ? 'is-collapsed' : '';
  }

  constructor() {}
}
