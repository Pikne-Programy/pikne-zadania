import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from 'src/app/helper/theme.service';
import { getErrorCode, INTERNAL_ERROR } from 'src/app/helper/utils';
import { HierarchyNode, HierarchyService } from '../service/hierarchy.service';

enum Modal {
    MOVE,
    ADD,
    EDIT,
    REORDER,
    DISCARD
}

@Component({
    selector: 'app-hierarchy-modification',
    templateUrl: './hierarchy-modification.component.html',
    styleUrls: ['./hierarchy-modification.component.scss']
})
export class HierarchyModificationComponent implements OnInit, OnDestroy {
    subject?: string;
    hierarchy?: HierarchyNode[];

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
                    .catch((error) => getErrorCode(error))
                    .finally(() => (this.isLoading = false));
                this.param$?.unsubscribe();
            }
        });

        this.theme$ = this.themeService.themeChange.subscribe((theme) => {
            this.isDarkTheme = ThemeService.isDarkTheme(theme);
        });
    }

    selectNode(node: HierarchyNode, state?: boolean) {
        if (state !== undefined) node.isSelected = state;
        else node.isSelected = !node.isSelected;

        if (!node.isSelected)
            for (const child of node.children) this.selectNode(child, false);
    }

    //#region Modals
    private editedNode: HierarchyNode | null = null;

    //#region Move Modal
    selectedNodes: HierarchyNode[] = [];
    moveModalTagList: HierarchyNode[] = [];
    get moveModalNodeList(): HierarchyNode[] | undefined {
        const i = this.moveModalTagList.length - 1;
        return this.filterMoveModalTags(
            i >= 0 ? this.moveModalTagList[i].children : this.hierarchy
        );
    }
    private filterMoveModalTags(
        list: HierarchyNode[] | undefined
    ): HierarchyNode[] {
        if (!list) return [];
        return list
            .filter(
                (node) => !node.exerciseId && !this.selectedNodes.includes(node)
            )
            .filter(
                (node) =>
                    node.name !== '' ||
                    this.selectedNodes.every((selected) => selected.exerciseId)
            );
    }

    move() {
        if (this.hierarchy) {
            this.isModified = true;
            const selectedNodes = this.getSelectedNodes(this.hierarchy, true);
            for (const node of selectedNodes)
                this.collapseOldParents(node.parent);

            const i = this.moveModalTagList.length - 1;
            const newParent = i >= 0 ? this.moveModalTagList[i] : null;
            for (const node of selectedNodes) node.parent = newParent;

            const list = newParent ? newParent.children : this.hierarchy;
            list.push(...selectedNodes);
            this.expandNewParents(newParent);
        }
        else this.errorCode = INTERNAL_ERROR;
        this.closeModal();
    }

    private getSelectedNodes(
        tree: HierarchyNode[],
        removeFromTree?: boolean
    ): HierarchyNode[] {
        let result: HierarchyNode[] = [];
        for (const node of tree) {
            if (node.isSelected) {
                const selectedChildren = this.getSelectedNodes(
                    node.children,
                    removeFromTree
                );
                if (selectedChildren.length > 0)
                    result = result.concat(selectedChildren);
                else if (node.name !== '') {
                    if (removeFromTree) {
                        const i = tree.findIndex(
                            (treeNode) => treeNode === node
                        );
                        if (i === -1) {
                            this.errorCode = INTERNAL_ERROR;
                            return [];
                        }
                        tree.splice(i, 1);
                    }
                    result.push(node);
                }
            }
        }
        return result;
    }

    isMoveEnabled(): boolean {
        if (!this.hierarchy) return false;
        const selected = this.hierarchy.filter((node) => node.isSelected);
        if (selected.length === 1 && selected[0].name === '') return false;
        return selected.length > 0;
    }
    //#endregion

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
    addModalTagList: HierarchyNode[] = [];
    get addModalNodeList(): HierarchyNode[] | undefined {
        const i = this.addModalTagList.length - 1;
        return this.filterAddModalTags(
            i >= 0 ? this.addModalTagList[i].children : this.hierarchy
        );
    }
    private filterAddModalTags(
        list: HierarchyNode[] | undefined
    ): HierarchyNode[] {
        if (!list) return [];
        return list.filter((node) => !node.exerciseId && node.name !== '');
    }

    add() {
        if (this.hierarchy) {
            const newName = (this.newName!.value as string).trim();
            if (newName !== '') {
                this.isModified = true;
                this.collapseAll();
                const i = this.addModalTagList.length - 1;
                const parent = i >= 0 ? this.addModalTagList[i] : null;
                const list = parent ? parent.children : this.hierarchy;
                list.push({
                    name: newName,
                    children: [],
                    parent,
                    isSelected: true
                });
                this.expandNewParents(parent);
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
            this.collapseAll();
            this.editedNode.name = (this.editName!.value as string).trim();
            this.editedNode.isSelected = true;
            this.expandNewParents(this.editedNode.parent);
        }
        else this.errorCode = INTERNAL_ERROR;
        this.closeModal();
    }
    //#endregion

    //#region Reorder Modal
    childrenToReorder: HierarchyNode[] | null = null;

    drop(event: CdkDragDrop<HierarchyNode[]>) {
        if (this.childrenToReorder) {
            moveItemInArray(
                this.childrenToReorder,
                event.previousIndex,
                event.currentIndex
            );
        }
        else this.errorCode = INTERNAL_ERROR;
    }

    reorder() {
        if (this.editedNode && this.childrenToReorder) {
            this.isModified = true;
            this.editedNode.children = this.childrenToReorder;
            this.collapseAll();
            this.editedNode.isSelected = true;
            this.expandNewParents(this.editedNode.parent);
        }
        else this.errorCode = INTERNAL_ERROR;
        this.closeModal();
    }
    //#endregion

    //#region Add/delete tag
    addTag(node: HierarchyNode, modal: Modal.MOVE | Modal.ADD) {
        switch (modal) {
            case Modal.MOVE:
                this.moveModalTagList.push(node);
                break;
            case Modal.ADD:
                this.addModalTagList.push(node);
                break;
        }
    }

    deleteTag(pos: number, modal: Modal.MOVE | Modal.ADD) {
        switch (modal) {
            case Modal.MOVE:
                this.moveModalTagList.splice(pos);
                break;
            case Modal.ADD:
                this.addModalTagList.splice(pos);
                break;
        }
    }
    //#endregion

    //#region Expand/collapse nodes
    private collapseAll() {
        if (this.hierarchy)
            for (const node of this.hierarchy) this.selectNode(node, false);
        else this.errorCode = INTERNAL_ERROR;
    }

    private collapseOldParents(parent: HierarchyNode | null) {
        if (!parent) return;
        parent.isSelected = false;
        this.collapseOldParents(parent.parent);
    }

    private expandNewParents(parent: HierarchyNode | null) {
        if (!parent) return;
        parent.isSelected = true;
        this.expandNewParents(parent.parent);
    }
    //#endregion
    //#endregion

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
                case Modal.MOVE:
                    this.selectedNodes = this.getSelectedNodes(this.hierarchy);
                    this.moveModalTagList = [];
                    break;

                case Modal.ADD:
                    this.addModalTagList = [];
                    this.addForm.reset();
                    break;

                case Modal.EDIT:
                    this.editForm.reset();
                    if (editedNode) {
                        this.editedNode = editedNode;
                        this.editName?.setValue(editedNode.name);
                    }
                    else this.errorCode = INTERNAL_ERROR;
                    break;

                case Modal.REORDER:
                    if (editedNode) {
                        this.editedNode = editedNode;
                        this.childrenToReorder = [...editedNode.children];
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
        this.childrenToReorder = null;
    }

    navigateToDashboard() {
        if (this.subject)
            this.router.navigate(['/subject/dashboard', this.subject]);
        else this.router.navigate(['/subject/list']);
    }

    //#region Theme
    isDarkTheme = false;
    getNodeActionStyle(node: HierarchyNode) {
        return {
            'is-black': !node.isSelected && !this.isDarkTheme,
            'is-light': !node.isSelected && this.isDarkTheme,
            'is-inverted': !node.isSelected,
            'is-link': node.isSelected
        };
    }
    //#endregion

    ngOnDestroy() {
        this.param$?.unsubscribe();
        this.theme$?.unsubscribe();
    }
}
