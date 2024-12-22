import { AEDataLoader } from '../../utils/pixi-after-effects';
import { AnimationAE } from './animation-AE';
import { validateLanguageCode } from '../../utils/localization';
import { Application } from '../../wrappers/application';
import { Point } from '../../wrappers/point';
import { Point as PixiPoint } from 'pixi.js';
import { Game } from '../../scene-objects/game';

export abstract class AEAnimationLoader {
    protected animationNames: string[];
    protected isStartedAnimationLoop: boolean;
    protected loader: AEDataLoader;
    protected animations: Map<string, AnimationAE>;
    protected indexUpdate: number;

    constructor(
        protected app: Application,
        protected languageCode: string,
        protected pathPrefix: string,
        public isDeluxeGame: boolean,
        public isAmericanGame: boolean,
        protected defaultPositionRoulette: Point,
        protected isAnimationsEnable: boolean,
        protected enableEffects: boolean,
    ) {
        if (pathPrefix && pathPrefix !== '') {
            this.pathPrefix += '/';
        }
        this.isStartedAnimationLoop = false;
    }

    get numberOfAnimations(): number {
        return this.animations.size;
    }

    enableOwnAnimations(enable: boolean, drawerScale: number, localization?: string) {
        if (!enable && this.loader) {
            this.destroyAnimations();
        } else if (enable) {
            if (localization) {
                this.languageCode = validateLanguageCode(localization);
            }
            this.loader = new AEDataLoader();
            this.animations = new Map();
            this.createAnimations();
            this.scaleAERouletteAnimations(drawerScale);
            this.placeAERouletteAnimationsToCenter();
        }
        this.isAnimationsEnable = enable;
    }

    destroy() {
        Game.instance.updateEventManager.removeUpdateEvent(this.indexUpdate);
    }

    isAllAnimationsEnable(): boolean {
        return this.isAnimationsEnable;
    }

    scaleAERouletteAnimations(drawerScale: number) {
        if (drawerScale && this.animations) {
            const animationNames = this.animationNames;
            const scaleFactor = 0.4157303370786526;
            const scaleAnimation = Math.max(drawerScale * scaleFactor, 0.01);
            this.setScaleAllAnimations(animationNames, scaleAnimation);
        }
    }

    placeAERouletteAnimationsToCenter() {
        if (this.animations) {
            const animationNames = this.animationNames;
            // const center = new Point(this.wheelInteriorContainer.getContainer().x, this.wheelInteriorContainer.getContainer().y);
            const center = new Point(this.defaultPositionRoulette.x, this.defaultPositionRoulette.y);
            this.placeAnimations(animationNames, center);
        }
    }

    placeAnimations(animationNames: string[], position: Point) {
        this.launchWhenAnimationLoaded(animationNames, (animationAE: AnimationAE) => this.placeAnimation(animationAE, position));
    }

    setScaleAllAnimations(animationNames: string[], scale: number) {
        this.launchWhenAnimationLoaded(animationNames, (animationAE: AnimationAE) => this.setScaleAnimation(animationAE, scale));
    }

    hasAnimation = (animationName: string): boolean => this.animations && this.animations.has(animationName);

    isAllAnimationsLoaded(animationNames: string[], allAnimationsAE?: AnimationAE[]): boolean {
        if (!allAnimationsAE) {
            allAnimationsAE = animationNames.map(animationName => <AnimationAE> this.animations.get(animationName));
        }
        const isLoadedByAnimations: boolean[] = allAnimationsAE.map(anim => !!anim.animation);
        return isLoadedByAnimations.reduce((a: boolean, b: boolean) => a && b, true);
    }

    getAnimation(animationName: string, onGetAnimation: ((animationAE: AnimationAE | undefined) => void)): void {
        if (this.hasAnimation(animationName)) {
            const animationAE: AnimationAE = <AnimationAE> this.animations.get(animationName);
            this.loopWaitToLoaded(() => !!animationAE.animation, () => onGetAnimation(animationAE));
        } else {
            onGetAnimation(undefined);
        }
    }

    getAllAnimations(animationNames: string[], onGetAnimation: ((animationAE: AnimationAE[] | undefined) => void)): void {
        const allAnimationNames: string[] = animationNames.filter(animationName => this.hasAnimation(animationName));
        if (allAnimationNames && allAnimationNames.length > 0) {
            const animationsAE: AnimationAE[] = allAnimationNames.map(animationName => <AnimationAE> this.animations.get(animationName));
            const isAllAnimationsLoaded = (allAnimationsAE: AnimationAE[]) =>
                this.isAllAnimationsLoaded(allAnimationNames, allAnimationsAE);
            this.loopWaitToLoaded(() => isAllAnimationsLoaded(animationsAE), () => onGetAnimation(animationsAE));
        } else {
            onGetAnimation(undefined);
        }
    }

    callWhenAnimationLoadingFinished(onLoaded: (() => void)) {
        const animationNames: string[] = Array.from(this.animations.keys());
        this.loopWaitToLoaded(
            () => {
                let isAllAnimationsLoaded = true;
                for (let i = 0; i < animationNames.length; i++) {
                    if (this.hasAnimation(animationNames[i])) {
                        const animationAE: AnimationAE = <AnimationAE> this.animations.get(animationNames[i]);
                        if (!animationAE.isAnimationLoaded) {
                            isAllAnimationsLoaded = false;
                            break;
                        }
                    }
                }
                return isAllAnimationsLoaded;
            },
            onLoaded
        );
    }

    forEach(callbackfn: (animationAE: AnimationAE, animationName?: string) => void) {
        if (this.animations) {
            const animationNames: string[] = Array.from(this.animations.keys());
            animationNames.forEach((nameAnim: string) => {
                if (this.hasAnimation(nameAnim)) {
                    const animationAE: AnimationAE = <AnimationAE> this.animations.get(nameAnim);
                    callbackfn(animationAE, nameAnim);
                }
            });
        }
    }

    startAnimation(animationName: string, position?: Point): void {
        if (this.hasAnimation(animationName)) {
            const animationAE: AnimationAE = <AnimationAE> this.animations.get(animationName);
            this.loopWaitToLoaded(() => !!animationAE.animation, () => {
                if (position) {
                    this.placeAnimation(animationAE, position!);
                }
                animationAE.startAnimation();
            });

            if (!this.isStartedAnimationLoop) {
                // requestAnimationFrame(this.animate);
                this.indexUpdate = Game.instance.updateEventManager.addUpdateEvent(this.animate);
                this.isStartedAnimationLoop = true;
            }
        } else {
            console.warn(`Animation ${animationName} not loader.`);
        }
    }

    stopAnimation(animationName: string, position?: Point): void {
        if (this.hasAnimation(animationName)) {
            const animationAE: AnimationAE = <AnimationAE> this.animations.get(animationName);
            this.loopWaitToLoaded(() => !!animationAE.animation, () => {
                if (position) {
                    this.placeAnimation(animationAE, position!);
                }
                animationAE.stopAnimation();
            });
        } else {
            console.warn(`Animation ${animationName} not loader.`);
        }
    }

    destroyAnimations() {
        if (this.animations) {
            const animationNames: string[] = Array.from(this.animations.keys());
            animationNames.forEach((nameAnim: string) => {
                if (this.hasAnimation(nameAnim)) {
                    const animationAE: AnimationAE = <AnimationAE> this.animations.get(nameAnim);
                    animationAE.destroy();
                }
            });
            this.animations.clear();
        }
        this.isAnimationsEnable = false;
    }

    cancelLoading() {
        if (this.animations) {
            const animationNames: string[] = Array.from(this.animations.keys());
            if (animationNames) {
                animationNames.forEach((nameAnim: string) => {
                    if (nameAnim && this.hasAnimation(nameAnim)) {
                        const animationAE: AnimationAE = <AnimationAE> this.animations.get(nameAnim);
                        if (animationAE) {
                            animationAE.cancelLoading();
                        }
                    }
                });
            }
        }
        this.destroyAnimations();
        this.destroy();
    }

    protected abstract createAnimations(): void;

    protected animate = (timestamp: number) => {
        const animationNames: string[] = Array.from(this.animations.keys());
        animationNames.forEach((nameAnim: string) => {
            if (this.hasAnimation(nameAnim)) {
                const animationAE: AnimationAE = this.animations.get(nameAnim)!;
                if (animationAE && !animationAE.isFinishedAnimation && animationAE.animation) {
                    // console.log(AnimationName[nameAnim]);
                    animationAE.animation.update(timestamp);
                    animationAE.update(timestamp);
                }
            }
        });

        // if (this.app && this.app.renderer) {
        //     if (this.app.stage) {
        //         this.app.renderer.render(this.app.stage);
        //     }
        //     requestAnimationFrame(this.animate);
        // }
    }

    protected launchWhenAnimationLoaded(animationNames: string[], onAnimationLoaded: (animationAE: AnimationAE) => void) {
        animationNames.forEach((nameAnim: string) => {
            if (this.hasAnimation(nameAnim)) {
                const animationAE: AnimationAE = this.animations.get(nameAnim)!;
                this.loopWaitToLoaded(() => !!animationAE.animation, () => {
                    onAnimationLoaded(animationAE);
                });
            }
        });
    }

    protected loopWaitToLoaded(loadWaitCondition: (() => boolean), onLoaded: (() => void)): void {
        if (loadWaitCondition()) {
            onLoaded();
        } else {
            setTimeout(() => this.loopWaitToLoaded(loadWaitCondition, onLoaded), 0);
        }
    }

    protected setScaleAnimation(animationAE: AnimationAE, scale: number): void {
        const currentPosition = animationAE.animation.position;
        const basePosition = new Point(
            currentPosition.x - animationAE.positionOffset.x + animationAE.width / 2,
            currentPosition.y - animationAE.positionOffset.y + animationAE.height / 2);
        animationAE.scale = scale;
        this.placeAnimation(animationAE, basePosition);
    }

    protected placeAnimation(animationAE: AnimationAE, position: Point): void {
        animationAE.animation.position = new PixiPoint(
            position.x + animationAE.positionOffset.x - animationAE.width / 2,
            position.y + animationAE.positionOffset.y - animationAE.height / 2,
            );
    }
}
