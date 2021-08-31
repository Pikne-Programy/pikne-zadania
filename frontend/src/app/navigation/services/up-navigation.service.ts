import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class UpNavService {
    constructor(private router: Router, private route: ActivatedRoute) {}

    navigateBack(fallback: string = '/') {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        return this.router.navigateByUrl(returnUrl ?? fallback);
    }

    forceNavigateBack(fallback: string = '/') {
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        if (returnUrl && this.canActivate(returnUrl))
            return this.router.navigateByUrl(returnUrl);
        return this.router.navigateByUrl(fallback);
    }

    //TODO Improve Validator
    private canActivate(url: string): boolean {
        const rules = [
            new RegExp('^/subject'),
            new RegExp('^/user')
        ];
        return rules.every((regex) => !regex.test(url));
    }
}
