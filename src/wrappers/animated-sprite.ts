// import 'core-js/modules/es7.object.values';
import { Container as PixiContainer, Texture as PixiTexture } from 'pixi.js';
import { CoreEngine } from '../core-engine';
import { Container } from "./container";
import { AnimatedSpriteDecorator } from './decorators/animate-sprite-decorator';
import { Point } from './point';

export class AnimatedSprite extends Container {
    protected spriteAnimated: AnimatedSpriteDecorator;
    protected spriteAnchor: Point;

    constructor(sheetdataList?: any[], animationName?: string, pixiSprite?: AnimatedSpriteDecorator) {
        // const texture = CoreLoader.getInstance().shared.resources["resourceName"];
        // texture.animations["animationName"];
        super(undefined, true);
        if (pixiSprite) {
            this.container = this.spriteAnimated = pixiSprite;
        } else {
            const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
            this.buildAnimationSprite(isPixiWebGl, sheetdataList!, animationName!);
        }
    }

    static fromContainerToSprite(container: Container) {
        const pixiContainer = container.containerPixiWebGl;
        if (pixiContainer instanceof AnimatedSpriteDecorator) {
            return new AnimatedSprite(undefined, undefined, <AnimatedSpriteDecorator> pixiContainer);
        }
        return undefined;
    }

    get anchor() {
        if (!this.spriteAnchor) {
            this.spriteAnchor = new Point(this.spriteAnimated.anchor.x, this.spriteAnimated.anchor.y);
        }
        return this.spriteAnchor;
    }

    set anchor(value: Point) {
        if (!this.spriteAnchor) {
            this.spriteAnchor = new Point(value.x, value.y);
        } else {
            this.spriteAnchor.set(value.x, value.y);
        }
        this.spriteAnimated.anchor.set(value.x, value.y);
    }

    get spritePixiWebGl() {
        return this.spriteAnimated;
    }

    set blendMode(newBlendMode: number) {
        this.spriteAnimated.blendMode = newBlendMode;
    }

    get blendMode() {
        return this.spriteAnimated.blendMode;
    }

    setAnchor(x: number, y: number) {
        if (!this.spriteAnchor) {
            this.spriteAnchor = new Point(x, y);
        } else {
            this.spriteAnchor.set(x, y);
        }
        this.spriteAnimated.anchor.set(x, y);
    }

    getChildrenAt(index: number): Container | undefined {
        const displayObject = this.container.children[index];
        if (displayObject instanceof AnimatedSpriteDecorator) {
            const newSprite = new AnimatedSprite();
            newSprite.container = <PixiContainer> displayObject;
            return newSprite;
        }
        if (displayObject instanceof PixiContainer) {
            return new Container(<PixiContainer> displayObject);
        }
    }

    private buildAnimationSprite(isPixiWebGl: boolean, sheetdataList?: any, animationName?: string) {
        if (isPixiWebGl && animationName && sheetdataList) {
            let frames: any = [];
            for (let sheetdata of sheetdataList) {
                const textures = [];
                for (const key in sheetdata.textures) {
                    textures.push(sheetdata.textures[key]);
                }
                frames = frames.concat(textures);
                // frames = frames.concat(Object.values(sheetdata.textures));
            }
            this.container = this.spriteAnimated = new AnimatedSpriteDecorator(frames);
        }
    }

    get isInLoop(): boolean { return this.spriteAnimated.loop; }
    set isInLoop(putInLoop: boolean) { this.spriteAnimated.loop = putInLoop; }
    get animationSpeed(): number { return this.spriteAnimated.animationSpeed; }
    set animationSpeed(speed: number) { this.spriteAnimated.animationSpeed = speed; }

    play(onAnimationFinished?: (() => void)) {
        this.spriteAnimated.stop();
        if (onAnimationFinished) {
            this.spriteAnimated.onComplete = onAnimationFinished;
        }
        // this.spriteAnimated.onFrameChange = () => console.log("WAAAAAAAT!!!");
        this.spriteAnimated.play();
    }

    stop() {
        this.spriteAnimated.stop();
    }

    destroy() {
        if (this.spriteAnimated.textures && this.spriteAnimated.textures.length > 0) {
            try {
                // Don't destroy or the animation won't be working anymore. See how to fix that Pixi issue in the furture.
                // this.spriteAnimated.destroy({
                //     children: true,
                //     texture: true,
                //     baseTexture: true,
                // });
            } catch (error) {
                // SpriteAnimation already deleted, nothing to do here.
            }
        }
    }

}