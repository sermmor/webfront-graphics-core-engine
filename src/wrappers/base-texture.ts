import {
    BaseTexture as PixiBaseTexture,
    MIPMAP_MODES as PIXI_MIPMAP_MODES,
    WRAP_MODES as PIXI_WRAP_MODES,
    SCALE_MODES as PIXI_SCALE_MODES,
    FORMATS as PIXI_FORMATS,
    TYPES as PIXI_TYPES,
    TARGETS as PIXI_TARGETS,
} from 'pixi.js';
import { CoreEngine } from '../core-engine';
import { Resource } from './resource';

type ResourceType = Resource | string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;

interface BaseTextureOptions {
    mipmap?: number;
    anisotropicLevel?: number;
    wrapMode?: number;
    scaleMode?: number;
    format?: number;
    type?: number;
    target?: number;
    premultiplyAlpha?: boolean;
    width?: number;
    height?: number;
    resolution?: number;
    resourceOptions?: any;
}

interface PixiBaseTextureOptions {
    mipmap?: PIXI_MIPMAP_MODES;
    anisotropicLevel?: number;
    wrapMode?: PIXI_WRAP_MODES;
    scaleMode?: PIXI_SCALE_MODES;
    format?: PIXI_FORMATS;
    type?: PIXI_TYPES;
    target?: PIXI_TARGETS;
    premultiplyAlpha?: boolean;
    width?: number;
    height?: number;
    resolution?: number;
    resourceOptions?: any;
}

export class BaseTexture {
    private baseTexture: PixiBaseTexture;

    constructor(resource?: ResourceType, options?: BaseTextureOptions, baseTexture?: PixiBaseTexture) {
        if (baseTexture) {
            this.baseTexture = baseTexture;
        } else {
            const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
            this.buildBaseTexture(isPixiWebGl, resource, options);
        }
    }

    get baseTexturePixiWebGl() {
        return this.baseTexture;
    }

    static removeFromCache(baseTexture: string | BaseTexture): BaseTexture | null {
        const realBaseTexture = (baseTexture instanceof BaseTexture) ? baseTexture.baseTexture : baseTexture;
        if (CoreEngine.getInstance().isPixiWebGl) {
            const pixiResult = PixiBaseTexture.removeFromCache(realBaseTexture);
            return <BaseTexture | null> <any> (pixiResult ? new BaseTexture(undefined, undefined, pixiResult) : pixiResult);
        }
        return null;
    }

    destroy() {
        this.baseTexture.destroy();
    }

    private buildBaseTexture(isPixiWebGl: boolean, resource?: ResourceType, options?: BaseTextureOptions) {
        if (isPixiWebGl) {
            const pixiResource = (resource instanceof Resource) ? resource.resourcePixiWebGl : resource;
            const pixiOptions: PixiBaseTextureOptions | undefined = options ? {
                ...options
            } : options;
            this.baseTexture = new PixiBaseTexture(pixiResource, pixiOptions);
        }
    }
}
