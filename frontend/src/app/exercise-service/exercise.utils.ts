import { categorySeparator } from '../exercises/exercises';
import { capitalize } from '../helper/utils';

export interface ServerResponseNode {
  name: string;
  children: ServerResponseNode[] | string;
  done?: number | null;
}

export class Subject {
  constructor(public name: string, public exerciseTree: ExerciseTreeNode) {}

  static createSubjectList(
    serverResponse: ServerResponseNode[],
    getLocalDone: boolean
  ): Subject[] | null {
    const list: Subject[] = [];
    for (let node of serverResponse) {
      if (Array.isArray(node.children)) {
        list.push(
          new Subject(
            node.name,
            ExerciseTreeNode.createExerciseTree(
              getLocalDone,
              node.name,
              node.children,
              node.name
            )
          )
        );
      } else return null;
    }
    return list;
  }

  static checkSubjectListValidity(list: any): list is ServerResponseNode[] {
    if (Array.isArray(list)) {
      if (list.length > 0) {
        return list.every((node) => {
          if ('name' in node && 'children' in node) {
            if (Array.isArray(node.children))
              return Subject.checkSubjectListValidity(node.children);
            else return typeof node.children === 'string';
          } else return false;
        });
      } else return true;
    } else return false;
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
    getLocal: boolean,
    value: string | null,
    children: ServerResponseNode[],
    subject: string,
    parent: ExerciseTreeNode | null = null
  ): ExerciseTreeNode {
    const node = new ExerciseTreeNode(value, parent);
    children.forEach((child) => {
      if (Array.isArray(child.children)) {
        node.children.push(
          this.createExerciseTree(
            getLocal,
            child.name,
            child.children,
            subject,
            node
          )
        );
      } else {
        if (child.done !== undefined && getLocal)
          setLocalDone(child.children, child.done);
        node.children.push(
          new ExerciseTreeNode(
            capitalize(child.name),
            node,
            child.children,
            child.done === undefined && getLocal
              ? getLocalDone(child.children)
              : child.done
          )
        );
      }
    });
    return node;
  }
}

function getLocalDone(url: string): number | null {
  const localDone = localStorage.getItem(url);
  switch (localDone) {
    case null:
    case 'null':
      return null;
    default:
      if (isNaN(Number(localDone))) return null;
      return Number(localDone);
  }
}

function setLocalDone(name: string, done: number | null) {
  localStorage.setItem(name, done?.toString() ?? 'null');
}
