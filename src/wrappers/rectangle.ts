import { Rectangle as PixiRectangle } from 'pixi.js';
import { CoreEngine } from '../core-engine';

export class Rectangle {
    private rectangle: PixiRectangle;

    constructor(x?: number, y?: number, width?: number, height?: number) {
        const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
        this.buildRectangle(isPixiWebGl, x, y, width, height);
    }

    get x() {
        return this.rectangle.x;
    }

    get y() {
        return this.rectangle.y;
    }

    get width() {
        return this.rectangle.width;
    }

    get height() {
        return this.rectangle.height;
    }

    private buildRectangle(isPixiWebGl: boolean, x?: number, y?: number, width?: number, height?: number) {
        if (isPixiWebGl) {
            this.rectangle = new PixiRectangle(x, y, width, height);
        }
    }
}
