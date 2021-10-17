import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { getErrorCode } from 'src/app/helper/utils';
import {
    FileHeader,
    FileUploadService
} from '../../../file-upload.service/file-upload.service';

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
    @Input() exerciseHeader!: FileHeader;
    @Input() subject!: string;
    @Output() onCheck = new EventEmitter();
    files?: string[];

    errorCode: number | null = null;
    isLoading = true;
    uploadErrorCode: number | null = null;
    isUploadLoading = false;

    modalFile: File | null = null;
    constructor(private fileService: FileUploadService) {}

    ngOnInit() {
        this.fetchFileList(false, true);
    }

    fetchFileList(refresh: boolean = true, force: boolean = false) {
        if ((!this.isLoading && !this.isUploadLoading) || force) {
            this.isLoading = true;
            this.fileService
                .getFileList(this.exerciseHeader, refresh)
                .then((list) => (this.files = list))
                .catch((error) => (this.errorCode = getErrorCode(error)))
                .finally(() => {
                    if (this.errorCode === null && refresh)
                        setTimeout(() => (this.isLoading = false), 500);
                    else this.isLoading = false;
                });
        }
    }

    isFileAdded(file: string): boolean {
        return this.fileService.isFileAdded(file);
    }

    checkFile(file: string) {
        if (this.isFileAdded(file)) this.fileService.removeFile(file);
        else this.fileService.addFile(file);
        this.onCheck.emit();
    }

    onFilesChange(target: EventTarget | null) {
        if (target !== null && target instanceof HTMLInputElement)
            this.checkUploadedFile(target.files);
    }

    private async checkUploadedFile(files: FileList | null) {
        const file = files?.item(0);
        if (file) {
            const isUploaded = await this.fileService.isFileAlreadyUploaded(
                this.subject,
                file.name
            );
            if (isUploaded) this.modalFile = file;
            else this.uploadFile(file);
        }
    }

    uploadFile(file: File | null) {
        if (file) {
            this.modalFile = null;
            this.isUploadLoading = true;
            this.fileService
                .uploadFile(this.subject, file)
                .then(() => {
                    this.files?.push(file.name);
                    this.checkFile(file.name);
                })
                .catch((error) => this.uploadErrorCode = getErrorCode(error))
                .finally(() => {
                    if (this.errorCode === null)
                        setTimeout(() => (this.isUploadLoading = false), 500);
                    else this.isUploadLoading = false;
                });
        }
    }
}
