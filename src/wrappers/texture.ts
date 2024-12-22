import { Texture as PixiTexture, Point as PixiPoint, Rectangle as PixiRectangle } from 'pixi.js';
import { CoreEngine } from '../core-engine';
import { Point } from './point';
import { Rectangle } from './rectangle';
import { BaseTexture } from './base-texture';

export class Texture {
    private texture: PixiTexture;

    constructor(
        baseTexture?: BaseTexture,
        frame?: Rectangle,
        orig?: Rectangle,
        trim?: Rectangle,
        rotate?: number,
        anchor?: Point,
        pixiTexture?: PixiTexture
    ) {
        if (pixiTexture) {
            this.texture = pixiTexture;
        } else {
            const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
            this.buildTexture(isPixiWebGl, baseTexture!, frame, orig, trim, rotate, anchor);
        }
    }

    get texturePixiWebGl() {
        return this.texture;
    }

    get baseTexture(): BaseTexture {
        if (CoreEngine.getInstance().isPixiWebGl) {
            return new BaseTexture(undefined, undefined, this.texture.baseTexture);
        }
        return new BaseTexture(undefined, undefined, this.texture.baseTexture);
    }

    static fromImage = (imagePath: string): Texture => {
        return new Texture(undefined, undefined, undefined, undefined, undefined, undefined, PixiTexture.from(imagePath));
    }

    static removeFromCache(texture: string | Texture | PixiTexture): Texture | null {
        const realTexture = (texture instanceof Texture) ? texture.texture : texture;
        if (CoreEngine.getInstance().isPixiWebGl) {
            const pixiResult = PixiTexture.removeFromCache(realTexture);
            return <Texture | null> <any> (pixiResult ? new Texture(undefined, undefined, undefined, undefined, undefined, undefined, pixiResult) : pixiResult);
        }
        return null;
    }

    destroy(destroyBase?: boolean): void {
        if (CoreEngine.getInstance().isPixiWebGl) {
            this.texture.destroy(destroyBase);
        }
    }

    private buildTexture(
        isPixiWebGl: boolean,
        baseTexture: BaseTexture,
        frame?: Rectangle,
        orig?: Rectangle,
        trim?: Rectangle,
        rotate?: number,
        anchor?: Point
    ) {
        if (isPixiWebGl) {
            const pixiAnchor = anchor ? new PixiPoint(anchor.x, anchor.y) : anchor;
            const pixiFrame = (frame ? new PixiRectangle(frame.x, frame.y, frame.width, frame.height) : frame);
            const pixiOrig = (orig ? new PixiRectangle(orig.x, orig.y, orig.width, orig.height) : orig);
            const pixiTrim = (trim ? new PixiRectangle(trim.x, trim.y, trim.width, trim.height) : trim);

            this.texture = new PixiTexture(<any>baseTexture.baseTexturePixiWebGl, <any>pixiFrame, <any>pixiOrig, <any>pixiTrim, <any>rotate, <any>pixiAnchor);
        }
    }
}
