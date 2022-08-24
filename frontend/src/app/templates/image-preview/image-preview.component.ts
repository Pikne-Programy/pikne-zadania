import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    ImagePreviewService,
    ImageType
} from './service/image-preview.service';

@Component({
    selector: 'app-image-preview',
    templateUrl: './image-preview.component.html',
    styleUrls: ['./image-preview.component.scss']
})
export class ImagePreviewComponent implements OnInit, OnDestroy {
    image: ImageType | null = null;

    private preview$?: Subscription;
    constructor(private previewService: ImagePreviewService) {}

    ngOnInit() {
        this.preview$ = this.previewService.getPreview((preview) => {
            this.image = preview;
        });
    }

    close() {
        this.previewService.closePreview();
    }

    /* istanbul ignore next */
    ngOnDestroy() {
        this.preview$?.unsubscribe();
    }
}
