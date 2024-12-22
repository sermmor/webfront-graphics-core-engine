import { Element, ElementData } from './element';
import { MaskElement } from './mask';
import { Asset } from '../asset';
import { ShapeElement } from './shape';
import { ImageElement } from './image';
import { Point, DisplayObject, BLEND_MODES, Container } from 'pixi.js';

// enum Mode {Additive, Subtract, Intersect, Lighten, Darken, Difference, None}
export enum Mode {
    a,
    s,
    i,
    l,
    d,
    f,
    n
}

export interface Mask extends Element {
    inv?: boolean;
    nm?: string;
    pt?: Shape | ShapeKeyFramed;
    o?: Value | ValueKeyFramed;
    mode?: Mode;
    maskTargetLayer?: Element;
}

export interface ValueKeyFramed {
    s: number;
    t: number;
    i: { x: number[]; y: number[] };
}

export interface Value {
    k: number;
    x: string;
    ix: string;
}

export interface ShapeKeyFramed {
    k: ShapePropKeyframe[];
    x: string;
    ix: string;
    ti: number[];
    to: number[];
}

export interface ShapePropKeyframe {
    s: ShapeProp[];
    t: number;
    i: { x: number[]; y: number[] };
    o: { x: number[]; y: number[] };
}

export interface Shape {
    k: ShapeProp;
    x: string;
    ix: string;
    a: number;
}

export interface ShapeProp {
    c: boolean;
    i: number[];
    o: number[];
    v: number[];
}

export class CompElement extends Element {
    originWidth: number;
    originHeight: number;
    clonedLayers: Element[];
    autoOriented: number;
    masks: Mask[];
    layers: Element[];
    noreplay: boolean;

    constructor(data: ElementData) {
        super(data);
        if (data.w > 0 && data.h > 0) {
            this.originWidth = data.w;
            this.originHeight = data.h;
            this.scale = new Point(this.scaleX, this.scaleY);
        }
        if (this.scaleX < 0) {
            // flip mode.
            // reassign scale value because overwritten scale by this.width's setter
            this.scale.x = this.scaleX;
        }
        this.clonedLayers = [];
        this.autoOriented = data.ao;
    }

    allLayers(): Element[] {
        // let layers: (MaskElement | Element | ConcatArray<Element | null> | null)[] = [];
        let layers: Element[] = [];
        if (this.masks) {
            layers = layers.concat(
                this.masks.map((maskData: Mask) => {
                    return <Element>(<unknown>maskData.maskLayer);
                })
            );
        }
        if (!this.layers) {
            //   layers = layers.concat(this.children.map((child: DisplayObject) => {
            //     // if (child instanceof Element) {
            //     if ('interactiveEventMap' in child) {
            //       return child;
            //     }
            //     return null;
            //   }).filter(layer => layer !== null));
            const childrenLayer: Element[] = [];
            this.children.forEach((child: DisplayObject) => {
                if (child !== null && 'interactiveEventMap' in child) {
                    childrenLayer.push(child);
                }
            });
            layers = layers.concat(childrenLayer);
        } else {
            layers = layers.concat(this.layers);
        }
        return layers.concat(this.clonedLayers);
    }

    set frameRate(value: number) {
        super["frameRate"] = value;
        this.allLayers().forEach(layer => {
            if (layer !== null) {
                layer.frameRate = value;
            }
        });
    }

    set opt(value: Element) {
        super["opt"] = <Element>value;
        this.allLayers().forEach(layer => (layer.opt = value));
    }

    createMask(layer: Element, maskLayer: MaskElement): Mask {
        const mask: Mask = new Element();
        mask.maskTargetLayer = layer;
        mask.maskLayer = maskLayer;
        return mask;
    }

    addMaskLayer(layer: Element): void {
        if (!layer.hasMask) {
            return;
        }

        if (!this.masks) {
            this.masks = [];
        }

        const maskLayer: MaskElement = new MaskElement(layer);
        maskLayer.updateAnimationFrameByBaseFrame(this.startTime || 0);
        layer.addChild(<Element>(<unknown>maskLayer));
        layer.maskLayer = maskLayer;
        // this.masks.push({
        //   maskTargetLayer: layer,
        //   maskLayer,
        // });
        this.masks.push(this.createMask(layer, maskLayer));
    }

    setupTrackMatteLayer(layer: Element, trackMatteLayer: MaskElement): void {
        trackMatteLayer.isInvertedMask = layer.isInvertTrackMatteType();
        trackMatteLayer.alpha = 0; // none visible
        layer.maskLayer = trackMatteLayer;
        layer.addChild(<Element>(<unknown>trackMatteLayer));
        if (!this.masks) {
            this.masks = [];
        }
        // this.masks.push({
        //   maskTargetLayer: layer,
        //   maskLayer: trackMatteLayer,
        // });
        this.masks.push(this.createMask(layer, trackMatteLayer));
    }

    setupReference(assetMap: { [key: string]: Asset }): void {
        if (!this.referenceId) {
            return;
        }

        const asset = assetMap[this.referenceId];
        if (!asset) {
            return;
        }

        this.layers = <Element[]>asset.createLayers();
        this.layers.forEach(layer => {
            layer.inFrame += this.startTime;
            layer.outFrame += this.startTime;
            layer.startTime += this.startTime;
            layer.updateAnimationFrameByBaseFrame(this.startTime || 0);
        });
        if (this.blendMode !== BLEND_MODES.NORMAL) {
            this.layers.forEach(layer => {
                layer.blendMode = this.blendMode;
            });
        }
        this.resolveLayerReference(this.layers, assetMap, asset);
        this.layers.forEach((layer, index) => {
            if (layer.hasParent) {
                return;
            }

            if (layer.hasTrackMatteType) {
                const trackMatteLayer = this.layers[index + 1];
                this.setupTrackMatteLayer(layer, <MaskElement>trackMatteLayer);
            } else {
                this.addMaskLayer(layer);
            }

            if (layer.isTrackMatteData) {
                return;
            }
            this.addChild(layer);
        });
        this.clonedLayers.forEach(layer => {
            layer.inFrame += this.startTime;
            layer.outFrame += this.startTime;
            layer.startTime += this.startTime;
            layer.updateAnimationFrameByBaseFrame(this.startTime || 0);
            this.addChild(layer);
        });
    }

    createParentLayer(layer: Element, asset: Asset): Element | null {
        if (!layer.hasParent) {
            return null;
        }

        const parentLayer: Element = <Element>asset.createLayerByIndex(layer.parentIndex);
        if (parentLayer.shapes) {
            parentLayer.shapes.forEach((shape: ShapeElement) => {
                const parent = shape.parent;
                if (parent) {
                    parent.removeChild(shape);
                }
            });
            parentLayer.shapes = [];
            parentLayer.inFrame = layer.inFrame;
            parentLayer.outFrame = layer.outFrame;
        }
        this.addMaskLayer(layer);
        parentLayer.addChild(layer);
        const nextParentLayer = this.createParentLayer(parentLayer, asset);
        if (nextParentLayer) {
            nextParentLayer.addChild(parentLayer);
            return nextParentLayer;
        }
        return parentLayer;
    }

    resolveLayerReference(layers: Element[], assetMap: { [key: string]: Asset }, asset: Asset): void {
        layers.sort((a, b) => {
            if (a.index < b.index) {
                return -1;
            }
            if (a.index > b.index) {
                return 1;
            }
            return 0;
        });
        layers.reverse().forEach(layer => {
            const parentLayer = this.createParentLayer(layer, asset);
            if (parentLayer) {
                this.clonedLayers.push(parentLayer);
            }
        });
        layers.forEach((layer: Element) => {
            if (layer.isCompType() && 'originWidth' in layer) {
                (<CompElement>layer).setupReference(assetMap);
            } else if (layer.isImageType()) {
                (<ImageElement>layer).setupImage(assetMap);
            }
        });
    }

    updateMask(frame: number) {
        this.masks.forEach((maskData: Mask) => {
            let maskLayer = maskData.maskLayer;

            if (maskLayer.isTrackMatteData && maskLayer.maskLayer) {
                maskLayer = maskLayer.maskLayer;
            }

            const drawnMask = maskLayer.privateUpdateWithFrame(frame);
            if (drawnMask) {
                (<Element>maskData.maskTargetLayer).mask = maskLayer;
            } else if ((<Element>maskData.maskTargetLayer).mask) {
                // (<Element> maskData.maskTargetLayer).mask = null;
                (<Container>(<Element>maskData.maskTargetLayer).mask!).visible = false;
                (<Container>(<Element>maskData.maskTargetLayer).mask!).renderable = false;
            }
        });
    }

    updateNotLayers(frame: number) {
        this.alpha = 1;
        if (this.noreplay) {
            const children = this.children.concat();
            children.forEach((layer: DisplayObject) => {
                if (layer instanceof Element) {
                    if (layer.outFrame < frame) {
                        this.removeChild(layer);
                        layer.destroy();
                        return;
                    }
                    layer.privateUpdateWithFrame(frame);
                }
            });
            return;
        }
        this.children.forEach((layer: DisplayObject) => {
            if (layer instanceof Element) {
                layer.privateUpdateWithFrame(frame);
            }
        });
    }

    updateLayers(frame: number): void {
        if (this.noreplay) {
            this.layers = this.layers.filter(layer => {
                if (layer.outFrame < frame) {
                    this.removeChild(layer);
                    layer.destroy();
                    return false;
                }
                layer.privateUpdateWithFrame(frame);
                return true;
            });
            return;
        }
        this.layers.forEach((layer: Element) => {
            layer.privateUpdateWithFrame(frame);
        });
    }

    updateClonedLayers(frame: number): void {
        if (this.noreplay) {
            this.clonedLayers = this.clonedLayers.filter(layer => {
                if (layer.outFrame < frame) {
                    this.removeChild(layer);
                    layer.destroy();
                    return false;
                }

                layer.privateUpdateWithFrame(frame);
                layer.visible = true;
                return true;
            });
            return;
        }
        this.clonedLayers.forEach((layer: Element) => {
            layer.privateUpdateWithFrame(frame);
            layer.visible = true;
        });
    }

    privateUpdateWithFrame(frame: number): boolean {
        const result = super.privateUpdateWithFrame(frame);
        if (this.masks) {
            this.updateMask(frame);
        }
        if (!this.layers) {
            this.updateNotLayers(frame);
        } else {
            this.updateLayers(frame);
        }

        this.updateClonedLayers(frame);
        return result;
    }
}
