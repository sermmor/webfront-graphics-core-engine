// import 'core-js/modules/es7.object.values';
import { Container, Graphics } from 'pixi.js';
import * as element from './element';
import { AEDataLoader } from './loader';
import { Element, ElementData } from './element/element';
import { Asset } from './asset';

export interface DataAE {
    h?: number;
    w?: number;
    op?: number;
    ip?: number;
    layers?: (Element | ElementData)[];
    assets?: (Asset | ElementData)[];
    fr?: number;
    v?: string | number;
}

/**
 * @example
 * // create base container object
 * const stage = new PIXI.Container();
 * // create the AfterEffects instance from json path
 * PIXI.AfterEffects.fromJSONPath('bodymovin.json').then((ae) => {
 *   // add AfterEffects to stage
 *   stage.addChild(ae);
 *   // start AfterEffects animation
 *   ae.play();
 * });
 *
 * @class AfterEffects
 * @extends PIXI.Container
 * @memberof PIXI
 */
export class AfterEffects extends Container {
    finder: element.ElementFinder;
    inFrame: number;
    outFrame: number;
    frameRate: number;
    version: string | number;
    layers: (Element | ElementData)[] | undefined;
    textures: any[];
    textureCacheIds: any;
    player: element.ElementPlayer;
    deltaPlayer: element.ElementDeltaPlayer;
    masks: { maskLayer: Element; maskTargetLayer: Element }[];
    noreplay: boolean;
    [key: string]: any;

    constructor() {
        super();
        this.finder = new element.ElementFinder();
    }

    /**
     * Create PIXI.AfterEffects instance from JSON url
     *
     * @memberof PIXI.AfterEffects
     * @static
     * @param {string} - The JSON url
     * @param {object} [opt] - The animation option parameters
     * @param {boolean} [opt.noreplay] - enables no repeat mode. if enabled this option, instantly destroy already played component.
     * @return {Promise}
     */
    static fromJSONPath(jsonPath: string, opt: { noreplay?: boolean; [key: string]: any }): Promise<any> {
        return new AEDataLoader().loadJSON(jsonPath).then((data: DataAE) => {
            const ae = new AfterEffects();
            ae.setup(data, opt || {});
            return ae;
        });
    }

    /**
     * Create PIXI.AfterEffects instance from object created by AEDataLoader
     *
     * @memberof PIXI.AfterEffects
     * @static
     * @param {object} - The Object loaded by AEDataLoader
     * @param {object} [opt] - The animation option parameters
     * @param {boolean} [opt.noreplay] - enables no repeat mode. if enabled this option, instantly destroy already played component.
     * @return {PIXI.AfterEffects} The newly created AfterEffects
     */
    static fromData(data: DataAE, opt?: { noreplay?: boolean; [key: string]: any }): AfterEffects {
        const ae = new AfterEffects();
        ae.setup(data, opt || {});
        return ae;
    }

    /**
     * @memberof PIXI.AfterEffects#
     * @private
     * @param {object} - The Object loaded by AEDataLoader
     * @param {object} - The option ( `noreplay` ) for AfterEffects
     */
    setup(data: DataAE, opt: { noreplay?: boolean; [key: string]: any }) {
        this.width = data.w!;
        this.height = data.h!;
        this.inFrame = data.ip!;
        this.outFrame = data.op!;
        this.frameRate = data.fr!;
        this.version = data.v!;
        this.layers = data.layers;
        this.textures = data.assets!.filter(asset => !!asset.texture).map(asset => asset.texture);
        this.textureCacheIds = this.textures
            .filter(texture => texture.textureCacheIds && texture.textureCacheIds.length > 0)
            .map(texture => texture.textureCacheIds[0]);
        this.player = new element.ElementPlayer(
            this.frameRate,
            this.inFrame,
            this.outFrame,
            frame => {
                this.updateWithFrame(frame);
            },
            () => {
                this.emit('completed', this);
            }
        );
        this.deltaPlayer = new element.ElementDeltaPlayer(
            this.frameRate,
            this.inFrame,
            this.outFrame,
            frame => {
                this.updateWithFrame(frame);
            },
            () => {
                this.emit('completed', this);
            }
        );
        // Object.keys(opt).forEach((key: string) => {
        for (const key in opt) {
            this[key] = opt[key];
        }
        // });

        const layerIndexMap: { [key: number]: any } = {};
        this.layers!.forEach((layer: Element | ElementData) => {
            if ('index' in layer) {
                layerIndexMap[layer.index] = layer;
            }
        });

        this.layers!.reverse().forEach((layer: Element | ElementData) => {
            if ('frameRate' in layer && 'opt' in layer) {
                layer.frameRate = this.frameRate;
                layer.opt = <Element>opt;
            }
            if (layer.hasMask) {
                if (!this.masks) {
                    this.masks = [];
                }

                const maskLayer = new element.MaskElement(<Element>layer);
                this.addChild(<Element>layer);
                (<Element>layer).addChild(maskLayer);
                this.masks.push({
                    maskLayer,
                    maskTargetLayer: <Element>layer,
                });
            } else if ((<Element>layer).hasParent) {
                const parentLayer = layerIndexMap[(<Element>layer).parentIndex];
                parentLayer.addChild(layer);
            } else {
                this.addChild(<Element>layer);
            }
        });
        this.player.showFirstFrame();
        this.deltaPlayer.showFirstFrame();
    }

    /**
     * Find element by name
     *
     * @memberof PIXI.AfterEffects#
     * @param {string} - The name of element
     * @return {Element} - The found Element
     */
    find(name: string) {
        return this.finder.findByName(name, this);
    }

    /**
     * Update mask element by frame
     *
     * @private
     * @memberof PIXI.AfterEffects#
     * @param {number} - The current frame number
     */
    updateMask(frame: number) {
        this.masks.forEach((maskData: { maskLayer: Element; maskTargetLayer: Element }) => {
            const drawnMask = maskData.maskLayer.privateUpdateWithFrame(frame);
            if (drawnMask) {
                maskData.maskTargetLayer.mask = <Graphics> maskData.maskLayer;
            } else {
                (<unknown>maskData.maskTargetLayer.mask) = null;
            }
        });
    }

    /**
     * Update by current time
     *
     * @memberof PIXI.AfterEffects#
     * @param {number} - The current time
     */
    update(nowTime: number) {
        if (!this.layers) {
            return;
        }
        this.player.update(nowTime);
        this.layers.forEach((layer: Element) => {
            layer.update(nowTime);
        });
    }

    /**
     * Update by delta time
     *
     * @memberof PIXI.AfterEffects#
     * @param {number} - The delta time
     */
    updateByDelta(deltaTime: number) {
        if (!this.layers) {
            return;
        }
        this.deltaPlayer.update(deltaTime);
        this.layers.forEach((layer: Element) => {
            layer.updateByDelta(deltaTime);
        });
    }

    /**
     * Update by frame
     *
     * @memberof PIXI.AfterEffects#
     * @param {number} - The current frame number
     */
    updateWithFrame(frame: number) {
        if (this.masks) {
            this.updateMask(frame);
        }
        if (this.noreplay) {
            this.layers = this.layers!.filter(layer => {
                if ((<Element>layer).outFrame < frame) {
                    this.removeChild(<Element>layer);
                    (<Element>layer).destroy();
                    return false;
                }
                (<Element>layer).updateWithFrame(frame);
                return true;
            });
        } else {
            this.layers!.forEach((layer: Element) => {
                layer.updateWithFrame(frame);
            });
        }
    }

    /**
     * Start AfterEffects animation
     *
     * @memberof PIXI.AfterEffects#
     * @param {boolean} - Enable Loop playing
     */
    play(isLoop: boolean) {
        this.player.play(isLoop);
        this.deltaPlayer.play(isLoop);
    }

    /**
     * Pause AfterEffects animation
     *
     * @memberof PIXI.AfterEffects#
     */
    pause() {
        this.player.pause();
        this.deltaPlayer.pause();
    }

    /**
     * Resume AfterEffects animation
     *
     * @memberof PIXI.AfterEffects#
     */
    resume() {
        this.player.resume();
        this.deltaPlayer.resume();
    }

    /**
     * Stop AfterEffects animation
     *
     * @memberof PIXI.AfterEffects#
     */
    stop() {
        this.player.stop();
        this.deltaPlayer.stop();
    }
}
