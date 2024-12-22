import { resources as Pixi_resources } from 'pixi.js';
import { CoreEngine } from '../core-engine';

export class Resource {
    private resource: Pixi_resources.Resource;

    constructor(width?: number, height?: number) {
        const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
        this.buildResource(isPixiWebGl, width, height);
    }

    get resourcePixiWebGl(): Pixi_resources.Resource {
        return this.resource;
    }

    buildResource(isPixiWebGl: boolean, width?: number, height?: number) {
        if (isPixiWebGl) {
            this.resource = new Pixi_resources.Resource(width, height);
        }
    }
}
