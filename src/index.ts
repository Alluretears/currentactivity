#! /usr/bin/env node
import { execSync } from "child_process";
import { table } from "table";
import { asTree } from "treeify";
import "./extension";

async function printDumpInfo() {
  // exec adb shell dumpsys window displays
  const windowOutput = execSync("adb shell dumpsys window displays", {
    encoding: "utf-8",
  });
  const windowLines = windowOutput.split("\n");

  const currentFocusLine = findFirstLines(windowLines, "mCurrentFocus");
  const currentWindow = currentFocusLine?.split(" ")?.last(0)?.removeLast(1);

  const currentFocusAppLine = findFirstLines(windowLines, "mFocusedApp");
  const currentActivity = currentFocusAppLine?.split(" ")?.last(1);
  const stackId = currentFocusAppLine?.split(" ")?.last(0)?.removeLast(1);
  const currentApp = currentActivity?.split("/")?.at(0);

  const frameworkFragmentLines = Array<Line>();
  const androidxFragmentLines = Array<Line>();
  if (currentApp != undefined) {
    const activityOutput = execSync(
      "adb shell dumpsys activity " + currentApp,
      { encoding: "utf-8" },
    );
    const activityLines = activityOutput.split("\n");

    // 1. find top activity
    const activitesLines = findLines(activityLines, "ACTIVITY");
    let sliceStart = 0;
    let sliceEnd = activityLines.length - 1;
    activitesLines.forEach((v, index) => {
      if (currentActivity && v.content.indexOf(currentActivity) > 0) {
        sliceStart = v.index;
        if (index + 1 <= activitesLines.length - 1) {
          sliceEnd = activitesLines[index + 1].index;
        }
      }
    });

    // 2. cut out the top activity lines
    const topActivityLines = activityLines.slice(sliceStart, sliceEnd);
    // 3. split into framework fragments and androidx fragments
    const splitLine = findLastLines(
      topActivityLines,
      "Local FragmentActivity",
    );
    let frameworkLines: Array<string>;
    let androidxLines: Array<string> | undefined;
    if (splitLine != undefined) {
      const splitLineIndex = topActivityLines.indexOf(splitLine);
      frameworkLines = topActivityLines.slice(0, splitLineIndex);
      androidxLines = topActivityLines.slice(splitLineIndex);
    } else {
      frameworkLines = topActivityLines;
    }
    // 4. find all children of between "Active Fragments" and "Added Fragments" node
    const frameworkRangeLines = findRangeLines(
      frameworkLines,
      "Active Fragments",
      "Added Fragments",
    );
    frameworkRangeLines.sort((a, b) => a.start.index - b.start.index);
    frameworkRangeLines.forEach((v) => {
      const firstFragmentLine = frameworkLines?.at(v.start.index + 1);
      if (firstFragmentLine) {
        frameworkFragmentLines.push({
          content: firstFragmentLine,
          index: v.start.index + 1,
        });
      }
      frameworkLines?.forEach((item, index) => {
        if (
          firstFragmentLine &&
          spaceCount(item) == spaceCount(firstFragmentLine) &&
          index > v.start.index + 1 &&
          index < v.end.index
        ) {
          frameworkFragmentLines.push({ content: item, index: index });
        }
      });
    });

    if (androidxLines) {
      const androidxRangeLines = findRangeLines(
        androidxLines,
        "Active Fragments",
        "Added Fragments",
      );
      androidxRangeLines.sort((a, b) => a.start.index - b.start.index);

      androidxRangeLines.forEach((v) => {
        const firstFragmentLine = androidxLines?.at(v.start.index + 1);
        if (firstFragmentLine) {
          androidxFragmentLines.push({
            content: firstFragmentLine,
            index: v.start.index + 1,
          });
        }
        androidxLines?.forEach((item, index) => {
          if (
            firstFragmentLine &&
            spaceCount(item) == spaceCount(firstFragmentLine) &&
            index > v.start.index + 1 &&
            index < v.end.index
          ) {
            androidxFragmentLines.push({ content: item, index: index });
          }
        });
      });
    }
  }

  console.clear();

  // print current window
  if (currentWindow) {
    const windowTable = Array<Array<string>>();
    windowTable.push([currentWindow]);
    console.log(
      table(windowTable, {
        header: { content: "current window", alignment: "center" },
      }),
    );
  }

  // print current activity stack
  if (stackId != undefined) {
    const stackLines = windowLines.filter((v) => {
      const s = v.trim();
      return s.startsWith("*") && s.indexOf(stackId) > 0;
    });
    const stacks = stackLines.map((v) => v.trim().split(" ")[3]);
    if (stacks[0] != currentActivity) {
      stacks.shift();
    }
    const statckTable = Array<Array<string>>();
    stacks.forEach((v) => statckTable.push([v]));
    console.log("\n");
    console.log(
      table(statckTable, {
        header: { content: "activity stack", alignment: "center" },
      }),
    );
  }

  // print current fragments which in focused activity
  if (frameworkFragmentLines.length > 0 || androidxFragmentLines.length > 0) {
    const fragmentTable = Array<Array<string>>();
    if (frameworkFragmentLines.length > 0) {
      frameworkFragmentLines.sort((a, b) => a.index - b.index);
      fragmentTable.push([
        "framework fragments",
        asTree(
          toTreeObject(listToTree(toTreeArray(frameworkFragmentLines))),
          true,
        ),
      ]);
    }
    if (androidxFragmentLines.length > 0) {
      androidxFragmentLines.sort((a, b) => a.index - b.index);
      fragmentTable.push([
        "androidx fragments",
        asTree(
          toTreeObject(listToTree(toTreeArray(androidxFragmentLines))),
          true,
        ),
      ]);
    }
    console.log("\n");
    console.log(
      table(fragmentTable, {
        header: { content: "fragments", alignment: "center" },
      }),
    );
  }
}

type Tree = {
  id: string;
  content: string;
  parentId: string;
  children: Tree[] | null;
};

function toTreeArray(arr: Array<Line>): Array<Tree> {
  const result = Array<Tree>();
  arr.forEach((v, index) => {
    result.push({
      id: index.toString(),
      content: v.content.trim(),
      parentId: findParentIndex(arr.map((item) => item.content), v.content)
        .toString(),
      children: null,
    });
  });
  return result;
}

function findParentIndex(
  arr: Array<string>,
  target: string,
): number {
  const targetIndex = arr.indexOf(target);
  if (targetIndex < 0) return -1;
  let parentIndex = -1;
  for (let index = targetIndex; index >= 0; index--) {
    const element = arr[index];
    if (spaceCount(element) < spaceCount(target)) {
      parentIndex = index;
      break;
    }
  }
  return parentIndex;
}

function findParent(arr: Array<string>, target: string): string | undefined {
  const targetIndex = arr.indexOf(target);
  if (targetIndex < 0) return undefined;
  let parent = undefined;
  for (let index = targetIndex; index >= 0; index--) {
    const element = arr[index];
    if (spaceCount(element) < spaceCount(target)) {
      parent = element;
      break;
    }
  }
  return parent;
}

function listToTree(arr: Array<Tree>): Array<Tree> {
  const map: { [k: string]: number } = {};
  let node: Tree;
  const roots = Array<Tree>();
  for (let index = 0; index < arr.length; index++) {
    map[arr[index].id] = index;
    arr[index].children = [];
  }
  for (let index = 0; index < arr.length; index++) {
    node = arr[index];
    if (node.parentId !== "-1") {
      // if you have dangling branches check that map[node.parentId] exists
      arr[map[node.parentId]].children?.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function toTreeObject(arr: Array<Tree>): { [k: string]: any } {
  const result: { [k: string]: any } = {};
  arr.forEach((v) => {
    if (v.children && v.children.length > 0) {
      result[v.content.trim()] = toTreeObject(v.children);
    } else {
      result[v.content.trim()] = null;
    }
  });
  return result;
}

function findChildren(arr: Array<string>, target: string): Array<string> {
  const result = Array<string>();
  const targetIndex = arr.indexOf(target);
  if (targetIndex < 0 || targetIndex == arr.length - 1) return result;
  const nextBrotherIndex = arr.findIndex((v, i) =>
    spaceCount(v) == spaceCount(target) && i > targetIndex
  );
  if (nextBrotherIndex == targetIndex + 1) return result;
  const firstChild = arr.at(targetIndex + 1);
  if (firstChild) {
    const range = arr.slice(targetIndex, nextBrotherIndex);
    const children = range.filter((v) =>
      spaceCount(v) == spaceCount(firstChild)
    );
    result.concat(children);
  }
  return result;
}

function spaceCount(value: string): number {
  const trim = value.trimStart();
  return value.length - trim.length;
}

type Line = {
  content: string;
  index: number;
};

function findLines(
  lines: Array<string>,
  target: string,
): Array<Line> {
  const result = Array<Line>();
  lines.forEach((v, i) => {
    if (v.indexOf(target) > 0) {
      result.push({
        content: v,
        index: i,
      });
    }
  });
  return result;
}

function findFirstLines(
  lines: Array<string>,
  target: string,
): string | undefined {
  return findLines(lines, target).at(0)?.content;
}

function findLastLines(
  lines: Array<string>,
  target: string,
): string | undefined {
  return findLines(lines, target).last(0)?.content;
}

type RangeLine = {
  start: Line;
  end: Line;
};

function findRangeLines(
  lines: Array<string>,
  start: string,
  end: string,
): Array<RangeLine> {
  const startLines = findLines(lines, start);
  const endLines = findLines(lines, end);
  const allLines = startLines.concat(endLines);
  allLines.sort((a, b) => a.index - b.index);
  const children = Array<RangeLine>();
  const stack = Array<Line>();
  allLines.forEach((v) => {
    if (startLines.some((line) => Object.is(line, v))) {
      stack.push(v);
    } else {
      const start = stack.pop();
      if (start) {
        children.push({
          start,
          end: v,
        });
      }
    }
  });
  return children;
}

let oldActivity = "";
async function main(onCurrentWindowChanged: () => void) {
  while (true) {
    const currentActivity = execSync(
      "adb shell dumpsys window displays | grep -E 'mCurrentFocus'",
      { encoding: "utf-8" },
    );
    if (oldActivity != currentActivity) {
      onCurrentWindowChanged();
      oldActivity = currentActivity;
    }
  }
}

main(() => printDumpInfo());
