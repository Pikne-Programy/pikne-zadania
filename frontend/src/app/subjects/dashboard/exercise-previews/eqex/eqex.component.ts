import { Component, Input } from '@angular/core';
import { Exercise } from 'src/app/exercises/exercises';
import { setAsyncTimeout } from 'src/app/helper/tests/tests.utils';
import { removeMathTabIndex } from 'src/app/helper/utils';
import { PreviewComponentType } from '../preview.component';
declare var MathJax: any;

@Component({
  selector: 'app-eqex',
  templateUrl: './eqex.component.html',
  styleUrls: ['./eqex.component.scss', '../preview.component.scss'],
})
export class EqexPreviewComponent implements PreviewComponentType {
  exercise?: Exercise;
  @Input() shouldTypeset?: boolean;

  constructor() {}

  async setMath() {
    await setAsyncTimeout(50);
    return MathJax.typesetPromise().then(() => {
      removeMathTabIndex();
    });
  }
}
