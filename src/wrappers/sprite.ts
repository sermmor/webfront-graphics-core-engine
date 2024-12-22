import { Sprite as PixiSprite, Container as PixiContainer } from 'pixi.js';
import { Container } from './container';
import { Texture } from './texture';
import { Point } from './point';
import { CoreEngine } from '../core-engine';

export class Sprite extends Container {
    protected sprite: PixiSprite;
    protected spriteAnchor: Point;

    constructor(texture?: Texture, pixiSprite?: PixiSprite) {
        super(undefined, true);
        if (pixiSprite) {
            this.container = this.sprite = pixiSprite;
        } else {
            const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
            this.buildSprite(isPixiWebGl, texture);
        }
    }

    static fromContainerToSprite(container: Container) {
        const pixiContainer = container.containerPixiWebGl;
        if (pixiContainer instanceof PixiSprite) {
            return new Sprite(undefined, <PixiSprite> pixiContainer);
        }
        return undefined;
    }

    get anchor() {
        if (!this.spriteAnchor) {
            this.spriteAnchor = new Point(this.sprite.anchor.x, this.sprite.anchor.y);
        }
        return this.spriteAnchor;
    }

    set anchor(value: Point) {
        if (!this.spriteAnchor) {
            this.spriteAnchor = new Point(value.x, value.y);
        } else {
            this.spriteAnchor.set(value.x, value.y);
        }
        this.sprite.anchor.set(value.x, value.y);
    }

    get spritePixiWebGl() {
        return this.sprite;
    }

    set blendMode(newBlendMode: number) {
        this.sprite.blendMode = newBlendMode;
    }

    get blendMode() {
        return this.sprite.blendMode;
    }

    setAnchor(x: number, y: number) {
        if (!this.spriteAnchor) {
            this.spriteAnchor = new Point(x, y);
        } else {
            this.spriteAnchor.set(x, y);
        }
        this.sprite.anchor.set(x, y);
    }

    getChildrenAt(index: number): Container | undefined {
        const displayObject = this.container.children[index];
        if (displayObject instanceof PixiSprite) {
            const newSprite = new Sprite();
            newSprite.container = <PixiContainer> displayObject;
            return newSprite;
        }
        if (displayObject instanceof PixiContainer) {
            return new Container(<PixiContainer> displayObject);
        }
    }

    private buildSprite(isPixiWebGl: boolean, texture: Texture | undefined) {
        if (isPixiWebGl) {
            this.container = this.sprite = texture ? new PixiSprite(texture.texturePixiWebGl) : new PixiSprite();
        }
    }
}
