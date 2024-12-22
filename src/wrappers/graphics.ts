import { Graphics as PixiGraphics, Filter } from 'pixi.js';
import { Container } from './container';
import { GraphicsGeometry } from './graphics-geometry';
import { CoreEngine } from '../core-engine';

export class Graphics extends Container {
    graphics: PixiGraphics;

    constructor(geometry?: GraphicsGeometry, container?: PixiGraphics) {
        super(undefined, true);
        if (container) {
            this.container = this.graphics = container;
        } else {
            const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
            this.buildGraphics(isPixiWebGl, geometry);
        }
    }

    set filters (filter: Filter[]) {
        this.graphics.filters = filter;
    }

    get graphicPixiWebGl() {
        return this.graphics;
    }

    set skewY(value: number) {
        this.graphics.skew.y = value;
    }

    beginFill(color?: number, alpha?: number): Graphics {
        this.graphics.beginFill(color, alpha);
        this.container = this.graphics;
        return this;
    }

    endFill(): Graphics {
        this.graphics.endFill();
        this.container = this.graphics;
        return this;
    }

    lineStyle(width?: number, color?: number, alpha?: number, alignment?: number, native?: boolean): Graphics {
        this.graphics.lineStyle(width, color, alpha, alignment, native);
        this.container = this.graphics;
        return this;
    }

    lineTo(xToDraw: number, yToDraw: number): Graphics {
        this.graphics.lineTo(xToDraw, yToDraw);
        this.container = this.graphics;
        return this;
    }

    arc(xToDraw: number, yToDraw: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): Graphics {
        this.graphics.arc(xToDraw, yToDraw, radius, startAngle, endAngle, anticlockwise);
        this.container = this.graphics;
        return this;
    }

    drawRect(x: number, y: number, width: number, height: number): Graphics {
        this.graphics.drawRect(x, y, width, height);
        this.container = this.graphics;
        return this;
    }

    drawCircle(x: number, y: number, radius: number) {
        this.graphics.drawCircle(x, y, radius);
        this.container = this.graphics;
        return this;
    }

    drawRoundedRect(x: number, y: number, width: number, height: number, radiusRad: number): Graphics {
        this.graphics.drawRoundedRect(x, y, width, height, radiusRad);
        this.container = this.graphics;
        return this;
    }

    clone() {
        const clone = this.graphics.clone();
        return new Graphics(undefined, clone);
    }

    clear() {
        this.graphics.clone();
    }

    private buildGraphics(isPixiWebGl: boolean, geometry?: GraphicsGeometry) {
        if (isPixiWebGl && geometry) {
            const geometryWebGl = geometry.graphicsGeometryPixiWebGl;
            this.container = this.graphics = new PixiGraphics(geometryWebGl);
        } else if (isPixiWebGl) {
            const geometryReal = new GraphicsGeometry();
            this.container = this.graphics = new PixiGraphics(geometryReal.graphicsGeometryPixiWebGl);
        }
    }
}
