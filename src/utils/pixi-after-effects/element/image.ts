import { Sprite, BLEND_MODES } from 'pixi.js';
import { Element, ElementData } from './element';
import { Asset } from '../asset';

export class ImageElement extends Element {
    image: Sprite;

    constructor(data?: ElementData) {
        super(data);
        if (!data) {
            return;
        }
        if (data.bmPIXI) {
            this.blendMode = data.bmPIXI;
        }
        if (data.image) {
            this.image = data.image;
            if (this.blendMode !== BLEND_MODES.NORMAL) {
                this.image.blendMode = this.blendMode;
            }
            this.addChild(this.image);
        }
    }

    setupImage(assetMap: { [key: string]: Asset }) {
        if (this.image) {
            return;
        }
        if (!this.referenceId) {
            return;
        }

        const asset = assetMap[this.referenceId];
        if (!asset) {
            return;
        }

        if (asset.blendMode) {
            this.blendMode = asset.blendMode;
        }
        this.image = new Sprite(asset.texture);
        this.image.blendMode = this.blendMode;
        this.addChild(this.image);
    }
}
