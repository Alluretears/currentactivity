"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (!Array.prototype.last) {
    Array.prototype.last = function (n) {
        return this[this.length - 1 - n];
    };
}
if (!String.prototype.removeLast) {
    String.prototype.removeLast = function (n) {
        const end = this.length - n;
        return this.substring(0, end);
    };
}
