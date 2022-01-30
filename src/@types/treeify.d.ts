declare module "treeify" {
  export interface TreeObject {
    [k: string]: TreeValue;
  }
  export type TreeValue = string | TreeObject;
  export function asTree(
    treeObj: TreeObject,
    showValues?: boolean,
    hideFunctions?: boolean,
  ): string;
}
