/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */

import { Location } from '@angular/common';
import { TestBed, inject } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TestComponent } from 'src/app/helper/tests/tests.utils';
import { UpNavService } from './up-navigation.service';

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
        },
        {
            path: 'route3',
            component: TestComponent,
            children: [
                {
                    path: 'route4',
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
                const returnUrl = '/route1/route2';
                expect(service).toBeTruthy();
                await router.navigate(['/'], {
                    queryParams: { returnUrl }
                });

                await service.navigateBack();
                expect(location.path()).toBe(returnUrl);
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

    describe('forceNavigateBack', () => {
        it('should navigate up', inject(
            [UpNavService, Router, ActivatedRoute],
            async (service: UpNavService, router: Router) => {
                const returnUrl = '/route3/route4';
                expect(service).toBeTruthy();
                await router.navigate(['/route1'], {
                    queryParams: { returnUrl }
                });

                await service.forceNavigateBack();
                expect(location.path()).toBe(returnUrl);
            }
        ));

        it('should navigate to fallback route (no queryParams)', inject(
            [UpNavService, Router, ActivatedRoute],
            async (service: UpNavService, router: Router) => {
                const fallback = '/route1/route2';
                expect(service).toBeTruthy();
                await router.navigate(['/route1']);

                await service.forceNavigateBack(fallback);
                expect(location.path()).toBe(fallback);
            }
        ));

        const forbidden: string[] = ['/subject', '/user'];
        for (const route of forbidden) {
            it(`should navigate to fallback route (forbidden route - '${route}')`, inject(
                [UpNavService, Router, ActivatedRoute],
                async (service: UpNavService, router: Router) => {
                    const fallback = '/route1/route2';
                    expect(service).toBeTruthy();
                    await router.navigate(['/route1'], {
                        queryParams: { returnUrl: `${route}/test` }
                    });

                    await service.forceNavigateBack(fallback);
                    expect(location.path()).toBe(fallback);
                }
            ));
        }

        it('should navigate to homepage', inject(
            [UpNavService, Router, ActivatedRoute],
            async (service: UpNavService, router: Router) => {
                expect(service).toBeTruthy();
                await router.navigate(['/route1']);

                await service.forceNavigateBack();
                expect(location.path()).toBe('/');
            }
        ));
    });
});
