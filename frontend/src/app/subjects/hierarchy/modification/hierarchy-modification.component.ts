import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/helper/theme.service';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { HierarchyNode, HierarchyService } from '../service/hierarchy.service';

enum Modal {
    ADD,
    ADD_SUB,
    EDIT,
    DELETE,
    DISCARD
}

@Component({
    selector: 'app-hierarchy-modification',
    templateUrl: './hierarchy-modification.component.html',
    styleUrls: ['./hierarchy-modification.component.scss']
})
export class HierarchyModificationComponent implements OnInit, OnDestroy {
    readonly EXERCISE_LIST_ID = 'unassigned-exercises-list';
    readonly HIERARCHY_LIST_ID = 'hierarchy-list';

    subject?: string;
    hierarchy?: HierarchyNode[];
    exercises?: HierarchyNode[];
    selectedFolder: HierarchyNode | null = null;

    isLoading = true;
    errorCode: number | null = null;
    isModified = false;
    isSubmitLoading = false;
    submitErrorCode: number | null = null;

    readonly MODALS = Modal;
    private _openedModal: Modal | null = null;
    get openedModal() {
        return this._openedModal;
    }

    private param$?: Subscription;
    private theme$?: Subscription;
    constructor(
        private hierarchyService: HierarchyService,
        private themeService: ThemeService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.param$ = this.route.paramMap.subscribe((params) => {
            const subjectId = params.get('subjectId');
            if (subjectId) {
                this.subject = subjectId;
                this.hierarchyService
                    .getHierarchy(this.subject)
                    .then((tree) => (this.hierarchy = tree))
                    .catch((error) => {
                        const code = getErrorCode(error);
                        if (this.errorCode === null) this.errorCode = code;
                        console.error(`Hierarchy fetching error: ${code}`);
                    })
                    .finally(() => {
                        if (this.exercises || this.errorCode !== null)
                            this.isLoading = false;
                    });
                this.hierarchyService
                    .getExercises(this.subject)
                    .then((list) => (this.exercises = list))
                    .catch((error) => {
                        const code = getErrorCode(error);
                        if (this.errorCode === null) this.errorCode = code;
                        console.error(`Exercise fetching error: ${code}`);
                    })
                    .finally(() => {
                        if (this.hierarchy || this.errorCode !== null)
                            this.isLoading = false;
                    });
                this.param$?.unsubscribe();
            }
        });

        this.theme$ = this.themeService.themeChange.subscribe((theme) => {
            this.isDarkTheme = ThemeService.isDarkTheme(theme);
        });
    }

    selectNode(node: HierarchyNode, state?: boolean) {
        if (!node.exerciseId) {
            if (state !== undefined) node.isSelected = state;
            else node.isSelected = !node.isSelected;

            if (!node.isSelected) {
                for (const child of node.children)
                    this.selectNode(child, false);
            }
            this.selectedFolder = node.isSelected ? node : node.parent;
        }
    }

    //#region Modals
    private editedNode: HierarchyNode | null = null;

    //#region Add Modal
    addForm = new FormGroup({
        newName: new FormControl('', [
            Validators.required,
            Validators.pattern(/^(?!\s*$).*/)
        ])
    });
    get newName() {
        return this.addForm.get('newName');
    }

    add() {
        if (this.hierarchy) {
            const newName = (this.newName!.value as string).trim();
            if (newName !== '') {
                this.isModified = true;
                this.selectedFolder = HierarchyService.addCategoryToHierarchy(
                    newName,
                    this.editedNode ?? this.hierarchy
                );
            }
        }
        else this.errorCode = INTERNAL_ERROR;
        this.closeModal();
    }
    //#endregion

    //#region Edit Modal
    editForm = new FormGroup({
        editName: new FormControl('', [
            Validators.required,
            Validators.pattern(/^(?!\s*$).*/)
        ])
    });
    get editName() {
        return this.editForm.get('editName');
    }

    edit() {
        if (this.editedNode) {
            this.isModified = true;
            this.editedNode.name = (this.editName!.value as string).trim();
            this.selectNode(this.editedNode, true);
        }
        else this.errorCode = INTERNAL_ERROR;
        this.closeModal();
    }
    //#endregion

    //#region Delete Modal
    delete() {
        if (this.hierarchy && this.editedNode) {
            this.isModified = true;
            const result = HierarchyService.removeNodeFromHierarchy(
                this.editedNode,
                this.hierarchy
            );
            if (!result) this.errorCode = INTERNAL_ERROR;
        }
        else this.errorCode = INTERNAL_ERROR;
    }
    //#endregion
    //#endregion

    drop(event: CdkDragDrop<HierarchyNode[]>) {
        if (this.hierarchy) {
            this.isModified = true;
            if (event.previousContainer.id === this.EXERCISE_LIST_ID) {
                const exercise: HierarchyNode = event.item.data;
                HierarchyService.addExerciseToHierarchy(
                    exercise,
                    event.currentIndex,
                    this.selectedFolder ?? this.hierarchy
                );
            }
            else {
                moveItemInArray(
                    event.container.data,
                    event.previousIndex,
                    event.currentIndex
                );
            }
        }
    }

    submit() {
        if (this.subject && this.hierarchy) {
            this.isSubmitLoading = true;
            this.hierarchyService
                .setHierarchy(this.subject, this.hierarchy)
                .then(() => this.navigateToDashboard())
                .catch((error) => (this.submitErrorCode = getErrorCode(error)))
                .finally(() => (this.isSubmitLoading = false));
        }
        else this.submitErrorCode = INTERNAL_ERROR;
    }

    cancel() {
        if (this.isModified) this.openModal(Modal.DISCARD);
        else this.navigateToDashboard();
    }

    openModal(modal: Modal, editedNode?: HierarchyNode) {
        if (this.hierarchy) {
            switch (modal) {
                case Modal.ADD:
                case Modal.ADD_SUB:
                    this.addForm.reset();
                    this.editedNode = editedNode ?? null;
                    break;

                case Modal.EDIT:
                    this.editForm.reset();
                    if (editedNode) {
                        this.editedNode = editedNode;
                        this.editName?.setValue(editedNode.name);
                    }
                    else this.errorCode = INTERNAL_ERROR;
                    break;

                case Modal.DELETE:
                    if (editedNode) {
                        this.editedNode = editedNode;
                        if (
                            this.editedNode.exerciseId ||
                            this.editedNode.children.length === 0
                        ) {
                            this.delete();
                            return;
                        }
                    }
                    else this.errorCode = INTERNAL_ERROR;
                    break;

                case Modal.DISCARD:
                    break;
            }
            this._openedModal = modal;
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    closeModal() {
        this._openedModal = null;
        this.editedNode = null;
    }

    getConnectedDropLists() {
        return this.selectedFolder?.id ?? [this.HIERARCHY_LIST_ID];
    }

    navigateToDashboard() {
        if (this.subject)
            this.router.navigate(['/subject/dashboard', this.subject]);
        else this.router.navigate(['/subject/list']);
    }

    //#region Theme
    isDarkTheme = false;
    getNodeActionStyle(node: HierarchyNode) {
        const isSelected = node === this.selectedFolder;
        return {
            'is-black': !isSelected && !this.isDarkTheme,
            'is-light': !isSelected && this.isDarkTheme,
            'is-inverted': !isSelected,
            'is-link': isSelected
        };
    }
    //#endregion

    ngOnDestroy() {
        this.param$?.unsubscribe();
        this.theme$?.unsubscribe();
    }
}
