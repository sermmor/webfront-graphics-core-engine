import { ElementData } from './element/element';
import { Sprite, Text } from 'pixi.js';

interface InterceptorParams {
    text: Text;
    rawText: string;
    image: Sprite;
    imagePath: string;
    texture: any;
    isDisused: boolean;
    events: { [x: string]: Function };
    inPoint: number;
    outPoint: number;
    blendMode: number;
}

export interface InterceptorType {
    [key: string]: InterceptorParams;
}

/**
 * @class AEDataInterceptor
 * @memberof PIXI
 */
export class AEDataInterceptor {
    config: InterceptorType;

    constructor(config: InterceptorType) {
        this.config = config;
    }

    /**
     * Register interceptor option
     *
     * @memberof AEDataInterceptor#
     * @param {string} [name] - The interceptable keywords
     * @param {string} [name.text] - The name for overriding TextElement
     * @param {string} [name.rawText] - The name for overriding text content
     * @param {string} [name.image] - The name for overriding ImageElement
     * @param {string} [name.imagePath] - The name for overriding imagePath to load image
     * @param {string} [name.texture] - The name for overriding Texture of TextElement
     * @param {string} [name.isDisused] - The name for unused asset
     * @param {string} [name.events] - The name for overriding events
     * @param {string} [name.inPoint] - The name for overriding `inFrame` parameter
     * @param {string} [name.outPoint] - The name for overrindg `outFrame` prameter
     * @param {string} [name.blendMode] - The name for overrindg blend mode
     * @param {any} [param] - The value
     */
    add(name: string, param: InterceptorParams) {
        if (!this.config) {
            this.config = {};
        }
        this.config[name] = param;
    }

    /**
     * Intercept object loaded by AEDataLoader
     *
     * @memberof AEDataInterceptor#
     * @param {object} - The Object loaded by AEDataLoader
     */
    intercept(data: ElementData) {
        if (data.layers) {
            data.layers.forEach(layer => {
                this.intercept(layer);
            });
        }
        const cfg = this.config[data.nm] || this.config[data.p!] || this.config[data.id!];
        if (cfg) {
            if (cfg.text) {
                data.text = cfg.text;
            }
            if (cfg.rawText) {
                data.rawText = cfg.rawText;
            }
            if (cfg.image) {
                data.image = cfg.image;
            }
            if (cfg.imagePath) {
                data.imagePath = cfg.imagePath;
            }
            if (cfg.texture) {
                data.texture = cfg.texture;
            }
            if (cfg.isDisused) {
                data.isDisused = cfg.isDisused;
            }
            if (cfg.events) {
                data.events = cfg.events;
            }
            if (cfg.inPoint) {
                data.ip = cfg.inPoint;
            }
            if (cfg.outPoint) {
                data.op = cfg.outPoint;
            }
            if (cfg.blendMode) {
                data.bmPIXI = cfg.blendMode;
            }
        }
        return data;
    }
}
