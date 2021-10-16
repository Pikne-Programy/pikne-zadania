import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    EqExHeader,
    ExerciseHeader
} from '../exercise-modification/service/exercise-modification.utils';
import * as ServerRoutes from 'src/app/server-routes';
import { getErrorCode } from 'src/app/helper/utils';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

//NOTE Header types with static files
export type FileHeader = EqExHeader;
export function isFileHeader(header: ExerciseHeader): header is FileHeader {
    return EqExHeader.isEqExHeader(header);
}

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    private allFiles?: string[];

    constructor(private http: HttpClient) {}

    //#region Added files set
    private _addedFiles: Set<string> = new Set();
    get addedFiles(): string | string[] | undefined {
        switch (this._addedFiles.size) {
            case 0:
                return undefined;
            case 1:
                return this._addedFiles.values().next().value;
            default:
                return Array.from(this._addedFiles);
        }
    }
    set addedFiles(value: string | string[] | undefined) {
        if (value === undefined) this._addedFiles = new Set();
        else if (typeof value === 'string') this._addedFiles = new Set([value]);
        else this._addedFiles = new Set(value);
    }

    addFile(name: string) {
        this._addedFiles.add(name);
    }

    removeFile(name: string) {
        this._addedFiles.delete(name);
    }

    isFileAdded(name: string): boolean {
        return this._addedFiles.has(name);
    }

    resetAddedFiles() {
        this._addedFiles = new Set();
    }
    //#endregion

    getFileList(
        exerciseHeader: FileHeader,
        refresh: boolean = true
    ): Promise<string[]> {
        //TODO Fetching from server
        //TODO Error when header has file that does not exist on server
        this.addedFiles = exerciseHeader.img;
        const response = exerciseHeader.img ?? [];
        if (!this.allFiles || refresh) {
            this.allFiles = Array.isArray(response) ? response : [response];
            return Promise.resolve(this.allFiles);
        }
        return Promise.resolve(this.allFiles);
    }

    isFileAlreadyUploaded(subject: string, filename: string): Promise<boolean> {
        const NOT_FOUND_ERROR = 404;
        return this.http
            .get(ServerRoutes.staticFile(subject, filename), {
                responseType: 'blob'
            })
            .pipe(switchMap(() => of(true)))
            .toPromise()
            .catch((error) => {
                if (getErrorCode(error) === NOT_FOUND_ERROR) return false;
                throw error;
            });
    }

    uploadFile(subject: string, file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http
            .put(ServerRoutes.staticFile(subject, file.name), formData, {})
            .toPromise();
    }
}
