/* tslint:disable:no-unused-variable */

import { Location } from '@angular/common';
import { TestBed, inject } from '@angular/core/testing';
import { NavigationEnd, Router, RouterEvent } from '@angular/router';
import { Subject } from 'rxjs';
import { UpNavService } from './up-navigation.service';

describe('Service: UpNavigation', () => {
  let router = {
    navigateByUrl: jasmine.createSpy('navigateByUrl'),
    events: new Subject<RouterEvent>(),
  };
  let location = {
    back: jasmine.createSpy('back'),
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UpNavService,
        { provide: Router, useValue: router },
        { provide: Location, useValue: location },
      ],
    }).compileComponents();
    router.events = new Subject();
  });

  afterEach(() => {
    router.events.complete();
  });

  it('should navigate up', inject(
    [UpNavService, Router, Location],
    (service: UpNavService) => {
      expect(service).toBeTruthy();

      router.events.next(new NavigationEnd(1, 'route1', '/route1'));
      router.events.next(new NavigationEnd(2, 'route2', '/route1/route2'));

      service.back();
      expect(location.back).toHaveBeenCalled();
    }
  ));

  it('should navigate to homepage', inject(
    [UpNavService, Router],
    (service: UpNavService) => {
      expect(service).toBeTruthy();

      service.back();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/');
    }
  ));
});
