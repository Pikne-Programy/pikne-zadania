import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.scss']
})
export class ErrorComponent {
  readonly defaultMessage = 'Ups, coś poszło nie tak!';
  readonly defaultLink = ['Powrót do wyboru przedmiotu', '/public-exercises'];

  @Input() code?: number;
  @Input() message?: string;
  /**
   * Array with 2 elements: first - text, second - link.
   *
   * Uses default if null
   */
  @Input() link?: string[] | null;
  constructor() {}
}
