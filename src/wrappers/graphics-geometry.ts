import { GraphicsGeometry as PixiGraphicsGeometry } from 'pixi.js';
import { CoreEngine } from '../core-engine';

export class GraphicsGeometry {
    private graphicsGeometry: PixiGraphicsGeometry;

    constructor() {
        if (CoreEngine.getInstance().isPixiWebGl) {
            this.graphicsGeometry = new PixiGraphicsGeometry();
        }
    }

    get graphicsGeometryPixiWebGl(): PixiGraphicsGeometry {
        return this.graphicsGeometry;
    }
}
