import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanDeactivate,
    RouterStateSnapshot
} from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class ProgressSaveGuardService
implements CanDeactivate<ModificationComponent> {
    canDeactivate(
        component: ModificationComponent,
        _currentRoute: ActivatedRouteSnapshot,
        _currentState: RouterStateSnapshot,
        nextState?: RouterStateSnapshot
    ): boolean {
        const result = (
            !component.isModified() ||
            component.isSubmitted ||
            component.isExitConfirmed
        );
        if (!result) {
            component.isConfirmExitModalOpen = true;
            component.nextState = nextState?.url;
        }
        return result;
    }
}

export abstract class ModificationComponent {
    private _isSubmitted = false;
    get isSubmitted() {
        return this._isSubmitted;
    }

    private _isExitConfirmed = false;
    get isExitConfirmed() {
        return this._isExitConfirmed;
    }

    abstract isModified(): boolean;

    protected setSubmitFlag() {
        this._isSubmitted = true;
    }

    protected confirmExit() {
        this._isExitConfirmed = true;
    }

    nextState?: string = undefined;
    resetNavigation() {
        this.nextState = undefined;
    }

    isConfirmExitModalOpen = false;
    abstract onExitSubmit(): void;
    abstract onExitDiscard(): void;
    onExitCancel() {
        this.isConfirmExitModalOpen = false;
        this.resetNavigation();
    }
}
