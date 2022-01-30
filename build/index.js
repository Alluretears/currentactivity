#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const table_1 = require("table");
const treeify_1 = require("treeify");
require("./extension");
function printDumpInfo() {
    var _a, _b, _c, _d, _e, _f;
    return __awaiter(this, void 0, void 0, function* () {
        // exec adb shell dumpsys window displays
        const windowOutput = (0, child_process_1.execSync)("adb shell dumpsys window displays", {
            encoding: "utf-8",
        });
        const windowLines = windowOutput.split("\n");
        const currentFocusLine = findFirstLines(windowLines, "mCurrentFocus");
        const currentWindow = (_b = (_a = currentFocusLine === null || currentFocusLine === void 0 ? void 0 : currentFocusLine.split(" ")) === null || _a === void 0 ? void 0 : _a.last(0)) === null || _b === void 0 ? void 0 : _b.removeLast(1);
        const currentFocusAppLine = findFirstLines(windowLines, "mFocusedApp");
        const currentActivity = (_c = currentFocusAppLine === null || currentFocusAppLine === void 0 ? void 0 : currentFocusAppLine.split(" ")) === null || _c === void 0 ? void 0 : _c.last(1);
        const stackId = (_e = (_d = currentFocusAppLine === null || currentFocusAppLine === void 0 ? void 0 : currentFocusAppLine.split(" ")) === null || _d === void 0 ? void 0 : _d.last(0)) === null || _e === void 0 ? void 0 : _e.removeLast(1);
        const currentApp = (_f = currentActivity === null || currentActivity === void 0 ? void 0 : currentActivity.split("/")) === null || _f === void 0 ? void 0 : _f.at(0);
        const frameworkFragmentLines = Array();
        const androidxFragmentLines = Array();
        if (currentApp != undefined) {
            const activityOutput = (0, child_process_1.execSync)("adb shell dumpsys activity " + currentApp, { encoding: "utf-8" });
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
            const splitLine = findLastLines(topActivityLines, "Local FragmentActivity");
            let frameworkLines;
            let androidxLines;
            if (splitLine != undefined) {
                const splitLineIndex = topActivityLines.indexOf(splitLine);
                frameworkLines = topActivityLines.slice(0, splitLineIndex);
                androidxLines = topActivityLines.slice(splitLineIndex);
            }
            else {
                frameworkLines = topActivityLines;
            }
            // 4. find all children of between "Active Fragments" and "Added Fragments" node
            const frameworkRangeLines = findRangeLines(frameworkLines, "Active Fragments", "Added Fragments");
            frameworkRangeLines.sort((a, b) => a.start.index - b.start.index);
            frameworkRangeLines.forEach((v) => {
                const firstFragmentLine = frameworkLines === null || frameworkLines === void 0 ? void 0 : frameworkLines.at(v.start.index + 1);
                if (firstFragmentLine) {
                    frameworkFragmentLines.push({
                        content: firstFragmentLine,
                        index: v.start.index + 1,
                    });
                }
                frameworkLines === null || frameworkLines === void 0 ? void 0 : frameworkLines.forEach((item, index) => {
                    if (firstFragmentLine &&
                        spaceCount(item) == spaceCount(firstFragmentLine) &&
                        index > v.start.index + 1 &&
                        index < v.end.index) {
                        frameworkFragmentLines.push({ content: item, index: index });
                    }
                });
            });
            if (androidxLines) {
                const androidxRangeLines = findRangeLines(androidxLines, "Active Fragments", "Added Fragments");
                androidxRangeLines.sort((a, b) => a.start.index - b.start.index);
                androidxRangeLines.forEach((v) => {
                    const firstFragmentLine = androidxLines === null || androidxLines === void 0 ? void 0 : androidxLines.at(v.start.index + 1);
                    if (firstFragmentLine) {
                        androidxFragmentLines.push({
                            content: firstFragmentLine,
                            index: v.start.index + 1,
                        });
                    }
                    androidxLines === null || androidxLines === void 0 ? void 0 : androidxLines.forEach((item, index) => {
                        if (firstFragmentLine &&
                            spaceCount(item) == spaceCount(firstFragmentLine) &&
                            index > v.start.index + 1 &&
                            index < v.end.index) {
                            androidxFragmentLines.push({ content: item, index: index });
                        }
                    });
                });
            }
        }
        console.clear();
        // print current window
        if (currentWindow) {
            const windowTable = Array();
            windowTable.push([currentWindow]);
            console.log((0, table_1.table)(windowTable, {
                header: { content: "current window", alignment: "center" },
            }));
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
            const statckTable = Array();
            stacks.forEach((v) => statckTable.push([v]));
            console.log("\n");
            console.log((0, table_1.table)(statckTable, {
                header: { content: "activity stack", alignment: "center" },
            }));
        }
        // print current fragments which in focused activity
        if (frameworkFragmentLines.length > 0 || androidxFragmentLines.length > 0) {
            const fragmentTable = Array();
            if (frameworkFragmentLines.length > 0) {
                frameworkFragmentLines.sort((a, b) => a.index - b.index);
                fragmentTable.push([
                    "framework fragments",
                    (0, treeify_1.asTree)(toTreeObject(listToTree(toTreeArray(frameworkFragmentLines))), true),
                ]);
            }
            if (androidxFragmentLines.length > 0) {
                androidxFragmentLines.sort((a, b) => a.index - b.index);
                fragmentTable.push([
                    "androidx fragments",
                    (0, treeify_1.asTree)(toTreeObject(listToTree(toTreeArray(androidxFragmentLines))), true),
                ]);
            }
            console.log("\n");
            console.log((0, table_1.table)(fragmentTable, {
                header: { content: "fragments", alignment: "center" },
            }));
        }
    });
}
function toTreeArray(arr) {
    const result = Array();
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
function findParentIndex(arr, target) {
    const targetIndex = arr.indexOf(target);
    if (targetIndex < 0)
        return -1;
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
function findParent(arr, target) {
    const targetIndex = arr.indexOf(target);
    if (targetIndex < 0)
        return undefined;
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
function listToTree(arr) {
    var _a;
    const map = {};
    let node;
    const roots = Array();
    for (let index = 0; index < arr.length; index++) {
        map[arr[index].id] = index;
        arr[index].children = [];
    }
    for (let index = 0; index < arr.length; index++) {
        node = arr[index];
        if (node.parentId !== "-1") {
            // if you have dangling branches check that map[node.parentId] exists
            (_a = arr[map[node.parentId]].children) === null || _a === void 0 ? void 0 : _a.push(node);
        }
        else {
            roots.push(node);
        }
    }
    return roots;
}
function toTreeObject(arr) {
    const result = {};
    arr.forEach((v) => {
        if (v.children && v.children.length > 0) {
            result[v.content.trim()] = toTreeObject(v.children);
        }
        else {
            result[v.content.trim()] = null;
        }
    });
    return result;
}
function findChildren(arr, target) {
    const result = Array();
    const targetIndex = arr.indexOf(target);
    if (targetIndex < 0 || targetIndex == arr.length - 1)
        return result;
    const nextBrotherIndex = arr.findIndex((v, i) => spaceCount(v) == spaceCount(target) && i > targetIndex);
    if (nextBrotherIndex == targetIndex + 1)
        return result;
    const firstChild = arr.at(targetIndex + 1);
    if (firstChild) {
        const range = arr.slice(targetIndex, nextBrotherIndex);
        const children = range.filter((v) => spaceCount(v) == spaceCount(firstChild));
        result.concat(children);
    }
    return result;
}
function spaceCount(value) {
    const trim = value.trimStart();
    return value.length - trim.length;
}
function findLines(lines, target) {
    const result = Array();
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
function findFirstLines(lines, target) {
    var _a;
    return (_a = findLines(lines, target).at(0)) === null || _a === void 0 ? void 0 : _a.content;
}
function findLastLines(lines, target) {
    var _a;
    return (_a = findLines(lines, target).last(0)) === null || _a === void 0 ? void 0 : _a.content;
}
function findRangeLines(lines, start, end) {
    const startLines = findLines(lines, start);
    const endLines = findLines(lines, end);
    const allLines = startLines.concat(endLines);
    allLines.sort((a, b) => a.index - b.index);
    const children = Array();
    const stack = Array();
    allLines.forEach((v) => {
        if (startLines.some((line) => Object.is(line, v))) {
            stack.push(v);
        }
        else {
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
function main(onCurrentWindowChanged) {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            const currentActivity = (0, child_process_1.execSync)("adb shell dumpsys window displays | grep -E 'mCurrentFocus'", { encoding: "utf-8" });
            if (oldActivity != currentActivity) {
                onCurrentWindowChanged();
                oldActivity = currentActivity;
            }
        }
    });
}
main(() => printDumpInfo());
