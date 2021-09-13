import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { isObject, TYPE_ERROR } from 'src/app/helper/utils';
import * as ServerRoutes from 'src/app/server-routes';

interface ServerHierarchyNode {
    name: string;
    children: ServerHierarchyNode[] | string;
}
function isHierarchyNode(object: any): object is ServerHierarchyNode {
    const hasFields = isObject<ServerHierarchyNode>(object, [
        ['name', ['string']],
        ['children', 'any']
    ]);
    if (!hasFields) return false;
    if (typeof object.children === 'string') return true;
    return Array.isArray(object.children)
        ? object.children.every((child: any) => isHierarchyNode(child))
        : false;
}
function mapToServerHierarchyTree(
    hierarchyTree: HierarchyNode[]
): ServerHierarchyNode[] {
    return hierarchyTree
        .filter((node) => node.name !== '')
        .map((node) => {
            if (node.exerciseId) {
                return {
                    name: node.name,
                    children: node.exerciseId
                };
            }
            return {
                name: node.name,
                children: mapToServerHierarchyTree(node.children)
            };
        });
}

export interface HierarchyNode {
    name: string;
    children: HierarchyNode[];
    parent: HierarchyNode | null;
    exerciseId?: string;
    isSelected: boolean;
}
function mapToHierarchyTree(
    serverResponse: ServerHierarchyNode[],
    parent: HierarchyNode | null = null
): HierarchyNode[] {
    return serverResponse.map((node) => {
        if (Array.isArray(node.children)) {
            const result: HierarchyNode = {
                name: node.name,
                children: [],
                parent,
                isSelected: false
            };
            result.children = mapToHierarchyTree(node.children, result);
            return result;
        }
        return {
            name: node.name,
            children: [],
            parent,
            exerciseId: node.children,
            isSelected: false
        };
    });
}

function manageUnassigned(hierarchyTree: HierarchyNode[]): HierarchyNode[] {
    const i = hierarchyTree.findIndex((node) => node.name === '');
    if (i !== -1) {
        const unassigned = hierarchyTree.splice(i, 1);
        hierarchyTree.unshift(...unassigned);
    }
    else {
        hierarchyTree.unshift({
            name: '',
            children: [],
            parent: null,
            isSelected: false
        });
    }
    return hierarchyTree;
}

@Injectable({
    providedIn: 'root'
})
export class HierarchyService {
    constructor(private http: HttpClient) {}

    private isServerHierarchyTree(
        object: any
    ): object is ServerHierarchyNode[] {
        return (
            Array.isArray(object) &&
            object.every((node) => isHierarchyNode(node))
        );
    }

    private hasEmptyNodes(
        tree: ServerHierarchyNode[],
        count: number = 1
    ): boolean {
        return (
            tree.filter((node) => node.name === '').length > count &&
            tree.some((node) => {
                if (Array.isArray(node.children))
                    return this.hasEmptyNodes(node.children, 0);
                else return false;
            })
        );
    }

    getHierarchy(subject: string) {
        return this.http
            .post(ServerRoutes.hierarchyGet, { subject, raw: true })
            .pipe(
                switchMap((response) =>
                    this.isServerHierarchyTree(response) &&
                    !this.hasEmptyNodes(response)
                        ? of(manageUnassigned(mapToHierarchyTree(response)))
                        : throwError({ status: TYPE_ERROR })
                )
            )
            .toPromise();
    }

    setHierarchy(subject: string, tree: HierarchyNode[]) {
        return this.http
            .post(ServerRoutes.hierarchySet, {
                subject,
                hierarchy: mapToServerHierarchyTree(
                    this.removeNotAssigned(tree)
                )
            })
            .toPromise();
    }

    private removeNotAssigned(tree: HierarchyNode[]): HierarchyNode[] {
        return tree.filter((node) => node.name !== '');
    }
}
