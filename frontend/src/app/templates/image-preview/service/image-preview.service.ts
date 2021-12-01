import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';

export type ImageType = [src: string, alt: string];

@Injectable({
    providedIn: 'root'
})
export class ImagePreviewService implements OnDestroy {
    private _preview = new BehaviorSubject<ImageType | null>(null);

    getPreview(callback: (preview: ImageType | null) => void): Subscription {
        return this._preview.subscribe(callback);
    }

    openPreview(url: string, alt: string) {
        this._preview.next([url, alt]);
    }

    closePreview() {
        this._preview.next(null);
    }

    ngOnDestroy() {
        this._preview.complete();
    }
}
