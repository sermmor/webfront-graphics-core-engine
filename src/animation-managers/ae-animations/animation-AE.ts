import { AfterEffects, AEDataLoader } from '../../utils/pixi-after-effects';
import { Point as PixiPoint } from 'pixi.js';
import { AnimationInfo } from './types';
import { EventEmitterGraphicsLoader } from '../../common-components/event-emitter-graphics-loader';
import { Application } from '../../wrappers/application';
import { Texture } from '../../wrappers/texture';
import { BaseTexture } from '../../wrappers/base-texture';
import { Point } from '../../wrappers/point';

export abstract class AnimationAE {
    width: number;
    height: number;
    isFinishedAnimation: boolean;
    animation: AfterEffects;
    positionOffset: Point;
    name: string;
    protected canceledLoading: boolean;

    constructor(
            public app: Application,
            protected loader: AEDataLoader,
            protected animationInfo: AnimationInfo,
            protected scaleFactor: number = 1,
            protected position: Point = new Point(0, 0)
    ) {
        this.canceledLoading = false;
        this.positionOffset = animationInfo.positionOffset ? animationInfo.positionOffset : new Point(0, 0);
        this.animationInfo.loaded = false;
        this.setDefaultName(animationInfo.animationPath);
        this.loader.imagePathProxy = (path: any) => path;
        this.onCreate();

        this.loader.loadJSON(animationInfo.animationPath).then((data: any) => {
            if (!this.canceledLoading) {
                this.animation = AfterEffects.fromData(data);
                this.animationInfo.jsonData = data;
                this.animationInfo.animationContainer = this.animation;

                this.animation.on('completed', (o: any) => this.stopAnimation());

                this.animation.position = new PixiPoint(this.position.x, this.position.y);
                this.animation.scale = new PixiPoint(scaleFactor * this.animation.scale.x, scaleFactor * this.animation.scale.y);
                this.width = data.w * scaleFactor;
                this.height = data.h * scaleFactor;
                this.onLoad(data);
                this.isFinishedAnimation = true;

                // if (this.animationInfo.startAnimationOnLoader) {
                //     this.show(true);
                //     this.startAnimation();
                // } else {
                this.show(false);
                // }
                this.animationInfo.loaded = true;
                // EventEmitterGraphicsLoader.getInstance().emitPercent();
            }
        }).catch(reason => this.canceledLoading = true);
    }

    get visibleAtBegining(): boolean {
        return !!this.animationInfo.startAnimationOnLoader;
    }

    get z(): number {
        return this.animationInfo.z;
    }

    get isAnimationLoaded(): boolean {
        return this.animationInfo.loaded!;
    }

    get currentInfo(): AnimationInfo {
        return this.animationInfo;
    }

    set scale(newScaleFactor: number) {
        // this.animation.scale = new Point(newScaleFactor * this.animation.scale.x, newScaleFactor * this.animation.scale.y);
        this.animation.scale = new PixiPoint(newScaleFactor, newScaleFactor);
        this.width = this.width * newScaleFactor;
        this.height = this.height * newScaleFactor;
    }

    setPosition(newPosition: Point) {
        this.position = newPosition;
        this.animation.position = new PixiPoint(this.position.x, this.position.y);
    }

    setPositionPixiPoint(newPosition: PixiPoint) {
        this.position = new Point(newPosition.x, newPosition.y = newPosition.y - 11);
        this.animation.position = new PixiPoint(this.position.x, this.position.y);
    }

    startAnimation() {
        if (!this.isShow()) {
            this.show(true);
        }

        this.isFinishedAnimation = false;
        this.start();

        this.animation.play(!!this.animationInfo.isLoopAnimation);
    }

    stopAnimation() {
        this.isFinishedAnimation = true;
        this.animation.stop();
        this.end();
    }

    show(enable: boolean) {
        this.animation.visible = enable;
        this.animation.renderable = enable;
    }

    isShow = (): boolean => this.animation.visible;

    cancelLoading = () => this.canceledLoading = true;

    destroy() {
        this.clearTextureCache();
        if (this.animation) {
            this.animation.removeChildren();
        }
        this.isFinishedAnimation = true;
    }

    abstract update(timestamp: number): void;
    protected abstract onCreate(): void;
    protected abstract onLoad(data: any): void;
    protected abstract start(): void;
    protected abstract end(): void;

    private clearTextureCache() {
        let baseTex: any;
        if (this.animation && this.animation.textures) {
            this.animation.textures.forEach((texture: any) => {
                Texture.removeFromCache(texture);
                baseTex = texture.baseTexture;
                texture.destroy(true);
            });
        }
        if (baseTex) {
            BaseTexture.removeFromCache(baseTex);
            baseTex!.destroy();
        }
        if (this.animation) {
            this.animation.textures = [];
        }
    }

    private setDefaultName(animationPath: string) {
        const pathPieces = animationPath.split('/');
        this.name = pathPieces[pathPieces.length - 2]; // the folder name of the *.json animation file.
    }
}
