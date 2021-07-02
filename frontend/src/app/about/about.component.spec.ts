//Copyright 2021 Miłosz Wąsacz <wasacz.dev@gmail.com>
//
//SPDX-License-Identifier: AGPL-3.0-or-later

/* tslint:disable:no-unused-variable */

import {
  ComponentFixture,
  inject,
  TestBed,
  waitForAsync,
} from '@angular/core/testing';

import { AboutComponent } from './about.component';
import { UpNavService } from '../navigation/services/up-navigation.service';

describe('AboutComponent', () => {
  let component: AboutComponent;
  let fixture: ComponentFixture<AboutComponent>;
  let upNavService = {
    back: jasmine.createSpy('back'),
  };

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [AboutComponent],
        providers: [{ provide: UpNavService, useValue: upNavService }],
      }).compileComponents();

      fixture = TestBed.createComponent(AboutComponent);
      component = fixture.componentInstance;
    })
  );

  it('should create', inject([UpNavService], () => {
    expect(component).toBeTruthy();
  }));

  it('should navigate back on button click', inject([UpNavService], () => {
    let button = (
      fixture.debugElement.nativeElement as HTMLElement
    ).querySelector<HTMLElement>('.is-back-button');
    expect(button).withContext(`can't find button`).toBeTruthy();
    button?.click();

    fixture.whenStable().then(() => {
      expect(component.back).toHaveBeenCalled();
      expect(upNavService.back).toHaveBeenCalled();
    });
  }));
});
