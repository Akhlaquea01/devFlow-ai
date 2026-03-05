// Polyfill DOMMatrix for pdf.js running inside the Node extension host
if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        constructor() {}
    };
}
if (typeof global !== 'undefined' && !(global as any).Path2D) {
    (global as any).Path2D = class Path2D {};
}
if (typeof global !== 'undefined' && !(global as any).ImageData) {
    (global as any).ImageData = class ImageData {
        width = 0; height = 0; data = new Uint8ClampedArray(0);
        constructor() {}
    };
}
