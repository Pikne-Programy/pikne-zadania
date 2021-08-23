/* tslint:disable:no-unused-variable */

import { Component } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SidenavDirective } from './sidenav.directive';
/* FIXME(Nircek): it causes `ReferenceError: can't access lexical declaration 'TestComponent' before initialization`
describe('Directive: Sidenav', () => {
  TestBed.configureTestingModule({
    declarations: [TestComponent, SidenavDirective],
  });
  it('should be able to test directive', () => {
    TestBed.overrideComponent(TestComponent, {
      set: {
        template: '<mat-sidenav appSidenav></mat-sidenav>',
      },
    });
  });
});

TestBed.compileComponents().then(() => {
  const fixture = TestBed.createComponent(TestComponent);
  const directiveEl = fixture.debugElement.query(
    By.directive(SidenavDirective)
  );
  expect(directiveEl).not.toBeNull();
});
*/

@Component({
  template: '',
})
class TestComponent {}
