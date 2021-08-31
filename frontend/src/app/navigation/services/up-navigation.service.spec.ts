/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { TestBed, inject } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { UpNavService } from './up-navigation.service';

@Component({})
class TestComponent {
    constructor() {}
}

describe('Service: UpNavigation', () => {
    const routes = [
        {
            path: '',
            component: TestComponent
        },
        {
            path: 'route1',
            component: TestComponent,
            children: [
                {
                    path: 'route2',
                    component: TestComponent
                }
            ]
        }
    ];
    let location: Location;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule.withRoutes(routes)],
            providers: [UpNavService]
        }).compileComponents();
        TestBed.inject(Router).initialNavigation();
        TestBed.inject(ActivatedRoute);
        location = TestBed.inject(Location);
    });

    describe('navigateBack', () => {
        it('should navigate up', inject(
            [UpNavService, Router, ActivatedRoute],
            async (service: UpNavService, router: Router) => {
                expect(service).toBeTruthy();
                await router.navigate(['/'], { queryParams: { returnUrl: '/route1/route2' } });

                await service.navigateBack();
                expect(location.path()).toBe('/route1/route2');
            }
        ));

        it('should navigate to homepage', inject(
            [UpNavService, Router, ActivatedRoute],
            async (service: UpNavService, router: Router) => {
                expect(service).toBeTruthy();
                await router.navigate(['/route1']);

                await service.navigateBack();
                expect(location.path()).toBe('/');
            }
        ));

        it('should navigate to fallback route', inject(
            [UpNavService, Router, ActivatedRoute],
            async (service: UpNavService, router: Router) => {
                const fallback = '/route1/route2';
                expect(service).toBeTruthy();
                await router.navigate(['/route1']);

                await service.navigateBack(fallback);
                expect(location.path()).toBe(fallback);
            }
        ));
    });

    xdescribe('forceNavigateBack', () => {
        it('should ...', inject([UpNavService, Router, ActivatedRoute], (service: UpNavService, _router: Router) => {
            expect(service).toBeTruthy();
        }));
    });
});

