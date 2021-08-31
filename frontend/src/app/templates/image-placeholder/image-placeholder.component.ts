import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-image-placeholder',
    templateUrl: './image-placeholder.component.html',
    styleUrls: ['./image-placeholder.component.scss']
})
export class ImagePlaceholderComponent {
  @Input() src = 'assets/misc/png/exercise_placeholder.png';
  @Input() srcset = 'assets/misc/exercise_placeholder.svg';
  @Input() alt = '';

  constructor() {}
}
