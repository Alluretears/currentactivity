declare global {
  interface Array<T> {
    last(n: number): T;
  }

  interface String {
    removeLast(n: number): string;
  }
}
if (!Array.prototype.last) {
  Array.prototype.last = function <T>(n: number): T {
    return this[this.length - 1 - n];
  };
}

if (!String.prototype.removeLast) {
  String.prototype.removeLast = function (n: number): string {
    const end = this.length - n;
    return this.substring(0, end);
  };
}

export {};
