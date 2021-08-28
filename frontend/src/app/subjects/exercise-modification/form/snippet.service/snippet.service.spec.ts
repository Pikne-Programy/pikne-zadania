/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { SnippetService } from './snippet.service';

xdescribe('Service: Snippet', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SnippetService],
    });
  });

  it('should ...', inject([SnippetService], (service: SnippetService) => {
    expect(service).toBeTruthy();
  }));
});
