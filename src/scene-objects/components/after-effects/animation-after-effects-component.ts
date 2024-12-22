import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from '../component';
import { GameObject } from '../../game-object';
import { Container } from '../../../wrappers/container';
import { BaseTexture } from '../../../wrappers/base-texture';
import { AEDataLoader, AfterEffects } from '../../../utils/pixi-after-effects';
import { Point } from '../../../wrappers/point';
import { Texture } from '../../../wrappers/texture';
import { CoreFilter } from '../../../wrappers/static/core-filters';
import { Color } from '../../../wrappers/color';
import { CoreConstants } from '../../../wrappers/static/core-constants';
import { Game } from '../../game';

export class AnimationAfterEffectsComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    public static nameComponent = "AnimationAfterEffectsComponent";
    animationPath: string;
    color: Color;
    subAnimations: string[];

    private loader: AEDataLoader;
    private isLoaded: boolean;
    private animationData: any;
    private realAnimationContainer: AfterEffects;
    private animationContainer: Container; // = new Container(realAnimationContainer); realAnimationContainer: AfterEffects;
    private isEnabled: boolean;

    private indexUpdate: number;
    private isFinishedAnimation: boolean;

    private currentLayerEnabled: any;

    private temporal = {
        layerFounded: <any | undefined> undefined,
        layerTemporal: <any> undefined,
        nameSubAnimation: <string | undefined> undefined,
    };

    initialize = (): void => {
        this.isLoaded = false;
        this.loader = new AEDataLoader();
        this.loader.imagePathProxy = (path: any) => path;
        this.animationPath = this.completePath(Game.instance.propierties.imageAsssetPaths, this.animationPath)!;
    }

    load = (): Promise<Component> => {
        this.isFinishedAnimation = true;

        return new Promise<Component>((resolve, reject) => {
            this.loader.loadJSON(this.animationPath).then((data: any) => {
                this.animationData = data;
                this.realAnimationContainer = AfterEffects.fromData(data);
                this.animationContainer = new Container(this.realAnimationContainer);
                this.isLoaded = true;
                resolve(this);
            });
        });
    }

    buildAndPlace = (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container => {
        this.animationContainer.scaleX = gameObject.transform.scale.x * sceneObjectToScreenProportion.x;
        this.animationContainer.scaleY = gameObject.transform.scale.y * sceneObjectToScreenProportion.y;
        this.animationContainer.x = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        this.animationContainer.y = gameObject.transform.position.y * sceneObjectToScreenProportion.y;
        this.setEnable(gameObject.isEnabled);
        this.setOpacity(this.color.a);
        this.applyColor(this.color, true);

        return this.animationContainer;
    }

    setEnableAndStartSubAnimation = (
        nameSubAnimationToEnable: string,
        isEnable: boolean,
        playInLoop: boolean = false,
        onAnimationCompleted?: ((o: any) => any)
    ): any => {
        this.realAnimationContainer.stop();
        if (this.currentLayerEnabled) {
            this.currentLayerEnabled.removeAllListeners();
            this.currentLayerEnabled.stop();
        }
        if (this.realAnimationContainer.layers) {
            for (this.temporal.layerTemporal of this.realAnimationContainer.layers) {
                this.temporal.layerTemporal.visible = false;
            }
        }

        let subAnimation: any;
        let subAnimationToEnable: any;

        for (this.temporal.nameSubAnimation of this.subAnimations) {
            if (nameSubAnimationToEnable === this.temporal.nameSubAnimation) {
                subAnimationToEnable = this.realAnimationContainer.find(nameSubAnimationToEnable)[0];
                subAnimationToEnable.visible = isEnable;
                subAnimationToEnable.play(playInLoop);
            } else {
                subAnimation = this.realAnimationContainer.find(this.temporal.nameSubAnimation)[0];
                subAnimation.visible = false;
                subAnimation.stop();
            }
        }

        if (subAnimationToEnable && onAnimationCompleted) {
            subAnimationToEnable.on('completed', (o: any) => onAnimationCompleted(o));
        }

        return subAnimationToEnable;
    }

    stopSubAnimation = (subAnimation: any) => {
        subAnimation.stop();
    }

    startAnimation = (playInLoop: boolean = false, onAnimationCompleted?: ((o: any) => any)) => {
        this.realAnimationContainer.play(playInLoop);
        if (onAnimationCompleted) {
            this.realAnimationContainer.on('completed', (o: any) => onAnimationCompleted(o));
        }

        if (this.indexUpdate) {
            Game.instance.updateEventManager.removeUpdateEvent(this.indexUpdate);
        }

        this.indexUpdate = Game.instance.updateEventManager.addUpdateEvent(timestamp =>
            this.realAnimationContainer.update(timestamp));
    }

    stopAnimation = () => {
        this.realAnimationContainer.stop();
    }

    startLayerAnimation = (layerToEnable: any, onAnimationCompleted?: ((o: any) => any), doBeforePlayAnimation?: () => void) => {
        if (this.currentLayerEnabled) {
            this.currentLayerEnabled.removeAllListeners();
            this.currentLayerEnabled.stop();
            this.realAnimationContainer.stop();
            this.currentLayerEnabled.visible = false;
            if (this.realAnimationContainer.layers) {
                for (this.temporal.layerTemporal of this.realAnimationContainer.layers) {
                    this.temporal.layerTemporal.visible = false;
                }
            }
        }

        this.currentLayerEnabled = layerToEnable;
        this.currentLayerEnabled.visible = true;
        if (doBeforePlayAnimation) {
            doBeforePlayAnimation();
        }
        this.currentLayerEnabled.play();

        if (onAnimationCompleted) {
            this.currentLayerEnabled.on('completed', (o: any) => onAnimationCompleted(o));
        }

        if (this.indexUpdate) {
            Game.instance.updateEventManager.removeUpdateEvent(this.indexUpdate);
        }
        this.indexUpdate = Game.instance.updateEventManager.addUpdateEvent(timestamp =>
            this.currentLayerEnabled.update(timestamp));
    }

    getLayerAnimation = (layerName: string, fromLayerParent?: any): any => {
        this.temporal.layerFounded = undefined;
        if (!fromLayerParent && this.realAnimationContainer.layers) {
            for (this.temporal.layerTemporal of this.realAnimationContainer.layers) {
                if (this.temporal.layerTemporal.name === layerName) {
                    this.temporal.layerFounded = this.temporal.layerTemporal;
                }
            }
        } else if (fromLayerParent) {
            for (this.temporal.layerTemporal of fromLayerParent.layers) {
                if (this.temporal.layerTemporal.name === layerName) {
                    this.temporal.layerFounded = this.temporal.layerTemporal;
                }
            }
        }
        return this.temporal.layerFounded;
    }

    enableBlurEffectInLayer = (layerWithEffect: any, blurLevel: number = 6) => {
        const blur1 = CoreFilter.instance.createABlurFilter()!;
        blur1.blur = blurLevel;
        layerWithEffect.filters = [blur1];
        layerWithEffect.children[0].blendMode = CoreConstants.getInstance().BLEND_MODES.ADD;
    }

    applyColor = (color: Color, useOnlyMatrix = false)  => {
        if (!useOnlyMatrix) {
            this.setOpacity(color.a);
            this.color.r = color.r;
            this.color.g = color.g;
            this.color.b = color.b;
        }

        if (this.color.r >= 255 && this.color.g >= 255 && this.color.b >= 255) {
            CoreFilter.instance.clearAllFilters(this.animationContainer);
        } else {
            CoreFilter.instance.applyColorMatrixFilter(this.animationContainer, this.color);
        }
    }

    setEnable = (isEnable: boolean): void => {
        this.isEnabled = isEnable;
        if (this.animationContainer) {
            this.animationContainer.visible = isEnable;
            this.animationContainer.renderable = isEnable;
        }
    }

    setOpacity = (newAlpha: number): void => {
        this.color.a = newAlpha;
        if (this.animationContainer) {
            this.animationContainer.alpha = newAlpha;
        }
    }

    getAllComponents = (nameComponent: string): Component[] | undefined => {
        return [this];
    }

    getComponent = (nameComponent: any): Component | undefined => {
        return this;
    }

    getComponentByStringType = (nameComponent: string): Component | undefined => {
        if (nameComponent === AnimationAfterEffectsComponent.nameComponent) {
            return this;
        }
        return undefined;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return AnimationAfterEffectsComponent.nameComponent === nameComponent;
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === AnimationAfterEffectsComponent;
    }

    setRotation = (newRotation: number): void => {
        this.animationContainer.rotation = newRotation;
    }

    setScale = (newScaleX: number, newScaleY: number): void => {
        this.animationContainer.scale.x = newScaleX;
        this.animationContainer.scale.y = newScaleY;
    }

    setPosition = (newPositionX: number, newPositionY: number): void => {
        this.animationContainer.position.x = newPositionX;
        this.animationContainer.position.y = newPositionY;
    }

    clone = (): Component => {
        const clone: AnimationAfterEffectsComponent = new AnimationAfterEffectsComponent();
        clone.initialize();
        clone.animationData = this.animationData;
        clone.realAnimationContainer = AfterEffects.fromData(clone.animationData);
        clone.animationContainer = new Container(clone.realAnimationContainer);
        clone.isLoaded = true;

        clone.animationPath = this.animationPath;
        clone.color = new Color(`${this.color.r},${this.color.g},${this.color.b},${this.color.a}`);
        clone.subAnimations = [...this.subAnimations];

        clone.animationContainer.scaleX = this.animationContainer.scaleX;
        clone.animationContainer.scaleY = this.animationContainer.scaleY;
        clone.animationContainer.x = this.animationContainer.x;
        clone.animationContainer.y = this.animationContainer.y;
        clone.setEnable(this.isEnabled);
        clone.setOpacity(clone.color.a);
        clone.applyColor(clone.color, true);

        return clone;
    }

    destroy = (): BaseTexture | undefined => {
        if (this.animationContainer) {
            this.clearTextureCache(this.realAnimationContainer);
            this.animationContainer.removeChildren();
            this.animationContainer.parent.removeChild(this.animationContainer);
        }
        this.isFinishedAnimation = true;
        return undefined;
    }

    private completePath(paths: string[], nameFile: string): string | undefined {
        let currentPath: string;
        for (let i = 0; i < paths.length; i++) {
            currentPath = paths[i];
            if (currentPath.includes(nameFile)) {
                return currentPath;
            }
        }
        console.error(`${nameFile} path is missing. Add that path to GameProperties.`);
        return undefined;
    }

    private clearTextureCache(realAnimationContainer: AfterEffects) {
        let baseTex: any;
        if (realAnimationContainer && realAnimationContainer.textures) {
            realAnimationContainer.textures.forEach((texture: any) => {
                Texture.removeFromCache(texture);
                baseTex = texture.baseTexture;
                texture.destroy(true);
            });
        }
        if (baseTex) {
            BaseTexture.removeFromCache(baseTex);
            baseTex!.destroy();
        }
        if (realAnimationContainer) {
            realAnimationContainer.textures = [];
        }
    }
}
