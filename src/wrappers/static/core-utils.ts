import { utils as PIXI_utils } from 'pixi.js';

export class CoreUtils {
    private static instance: CoreUtils;

    constructor(private usePixiWebGl: boolean) {
        CoreUtils.instance = this;
    }

    static getInstance(): CoreUtils {
        return CoreUtils.instance;
    }

    skipHello(): void {
        PIXI_utils.skipHello();
    }

    clearTextureCache(): void {
        PIXI_utils.clearTextureCache();
    }
}
