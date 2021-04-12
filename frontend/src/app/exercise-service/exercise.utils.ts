import { categorySeparator } from '../exercises/exercises';
import { capitalize } from '../helper/utils';

export interface ServerResponseNode {
  name: string;
  children: any;
  done?: number | null;
}

export function checkSubjectListValidity(
  list: any
): list is ServerResponseNode[] {
  if (Array.isArray(list)) {
    if (list.length > 0) {
      return list.every((node) => {
        if ('name' in node && 'children' in node) {
          if (Array.isArray(node.children))
            return checkSubjectListValidity(node.children);
          else if (typeof node.children === 'string') return true;
          else return false;
        } else return false;
      });
    } else return true;
  } else return false;
}

export class Subject {
  constructor(public name: string, public exerciseTree: ExerciseTreeNode) {}

  static createSubjectList(serverResponse: ServerResponseNode[]): Subject[] {
    const list: Subject[] = [];
    serverResponse.forEach((node) => {
      list.push(
        new Subject(
          node.name,
          ExerciseTreeNode.createExerciseTree(
            node.name,
            node.children,
            node.name
          )
        )
      );
    });
    return list;
  }
}

export class ExerciseTreeNode {
  children: ExerciseTreeNode[] = [];
  constructor(
    public value: string | null,
    public parent: ExerciseTreeNode | null,
    public url: string | null = null,
    public done?: number | null
  ) {}

  getPath(): string {
    if (this.parent && this.parent.parent)
      return `${this.parent.getPath()}${categorySeparator}${
        this.url ? this.url : this.value
      }`;
    else return this.url ? this.url : this.value!;
  }

  static createExerciseTree(
    value: string | null,
    children: ServerResponseNode[],
    subject: string,
    parent: ExerciseTreeNode | null = null
  ): ExerciseTreeNode {
    const node = new ExerciseTreeNode(value, parent);
    children.forEach((child) => {
      if (Array.isArray(child.children)) {
        node.children.push(
          this.createExerciseTree(child.name, child.children, subject, node)
        );
      } else {
        node.children.push(
          new ExerciseTreeNode(
            capitalize(child.name),
            node,
            child.children,
            child.done === undefined ? null : child.done
          )
        );
      }
    });
    return node;
  }
}
