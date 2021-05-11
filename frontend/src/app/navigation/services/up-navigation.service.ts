import { Location } from '@angular/common';
import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UpNavService implements OnDestroy {
  private history: string[] = [];

  private event$: Subscription;
  constructor(private router: Router, private location: Location) {
    this.event$ = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd)
        this.history.push(event.urlAfterRedirects);
    });
  }

  back() {
    this.history.pop();
    if (this.history.length > 0) this.location.back();
    else this.router.navigateByUrl('/');
  }

  ngOnDestroy() {
    this.event$.unsubscribe();
  }
}
