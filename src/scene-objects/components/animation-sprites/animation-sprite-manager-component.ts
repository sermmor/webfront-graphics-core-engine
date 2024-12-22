import { GameObject } from "../../game-object";
import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from "../component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Container } from "../../../wrappers/container";
import { AnimationSpriteComponent } from "./animation-sprite-component";

export class AnimationSpriteManagerComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    public static nameComponent = "AnimationSpriteManagerComponent";
            
    protected animationManagerContainer: Container;
    protected temporal = {
        currentAnimSprite: <AnimationSpriteComponent | undefined> undefined,
        animationName: "",
    }
    
    protected currentAnimationPlaying: undefined | AnimationSpriteComponent;

    constructor(private animationSpriteComponentList: AnimationSpriteComponent[] = []) {
        super();
    }

    initialize = () => {
        this.animationSpriteComponentList.forEach(animSprite => {
            animSprite.initialize();
        });
    }

    load = (): Promise<Component> => {
        return new Promise<Component>((resolve, reject) => this.loadEach(0, () => resolve(this)));
        // for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
        //     await this.temporal.currentAnimSprite.load();
        // }
        // return this;
    }

    private loadEach = (i: number, onFinished: () => void) => {
        if (i === this.animationSpriteComponentList.length) {
            onFinished();
        } else {
            this.animationSpriteComponentList[i].load().then((c) => {
                setTimeout(() => {
                    this.loadEach(i + 1, onFinished);
                }, 0);
            });
        }
    }

    buildAndPlace = (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container => {
        this.animationManagerContainer = new Container();
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.animationManagerContainer.addChild(
                this.temporal.currentAnimSprite.buildAndPlace(gameObject, sceneContainer, parent, sceneObjectToScreenProportion, size, containerDebug)
            );
        }
        return this.animationManagerContainer;
    }

    playAnimation = (nameAnimation: string, isInLoop = false) => {
        this.currentAnimationPlaying = this.findAnimationByName(nameAnimation);
        if (this.currentAnimationPlaying) {
            this.currentAnimationPlaying.playAnimation(isInLoop);
        } else {
            console.error(`Not found animation with name ${nameAnimation}`);
        }
    }

    
    stopAnimation = () => {
        if (this.currentAnimationPlaying) {
            this.currentAnimationPlaying.stopAnimation();
            this.currentAnimationPlaying = undefined;
        }
    }
    
    findAnimationByName = (nameAnimation: string): AnimationSpriteComponent | undefined => {
        this.temporal.animationName = nameAnimation;
        return this.animationSpriteComponentList.find(this.checkAnimationName);
    }

    private checkAnimationName = (animationSprite: AnimationSpriteComponent): boolean => animationSprite.nameAnimation === this.temporal.animationName;

    setOpacity = (newAlpha: number): void => {
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.temporal.currentAnimSprite.setOpacity(newAlpha);
        }
    }

    setEnable = (isEnable: boolean): void => {
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.temporal.currentAnimSprite.setEnable(isEnable);
        }
    }

    getAllComponents = (nameComponent: string): Component[] | undefined => {
        if (nameComponent === AnimationSpriteComponent.nameComponent) {
            return this.animationSpriteComponentList;
        } else if (nameComponent === AnimationSpriteManagerComponent.nameComponent) {
            return [this];
        }
        return undefined;
    }

    getComponent = (component: any): Component | undefined => {
        if (component === AnimationSpriteComponent) {
            return this.animationSpriteComponentList;
        } else if (component === AnimationSpriteManagerComponent) {
            return [this];
        }
        return undefined;
    }

    getComponentByStringType = (nameComponent: string): Component | undefined => {
        if (nameComponent === AnimationSpriteComponent.nameComponent) {
            return (this.animationSpriteComponentList.length > 0) ? this.animationSpriteComponentList[0] : undefined;
        } else if (nameComponent === AnimationSpriteManagerComponent.nameComponent) {
            return this;
        }
        return undefined;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === AnimationSpriteComponent.nameComponent || nameComponent === AnimationSpriteManagerComponent.nameComponent;
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === AnimationSpriteComponent || typeComponent === AnimationSpriteManagerComponent;
    }

    setRotation = (newRotation: number): void => {
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.temporal.currentAnimSprite.setRotation(newRotation);
        }
    }

    setScale = (newScaleX: number, newScaleY: number): void => {
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.temporal.currentAnimSprite.setScale(newScaleX, newScaleY);
        }
    }

    setPosition = (newPositionX: number, newPositionY: number): void => {
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.temporal.currentAnimSprite.setPosition(newPositionX, newPositionY);
        }
    }

    clone = (): Component => {
        const clone = new AnimationSpriteManagerComponent(this.animationSpriteComponentList.map(p => <AnimationSpriteComponent> p.clone()));
        clone.animationManagerContainer = new Container();
        clone.animationSpriteComponentList.forEach(animSprite => {
            clone.animationManagerContainer.addChild(animSprite.animatedSprite);
        })
        return clone;
    }

    destroy = (): BaseTexture | undefined => {
        if (this.animationManagerContainer && this.animationManagerContainer.parent) {
            this.animationManagerContainer.parent.removeChild(this.animationManagerContainer);
        }
        for (this.temporal.currentAnimSprite of this.animationSpriteComponentList) {
            this.temporal.currentAnimSprite.destroy();
        }
        if (this.animationManagerContainer) {
            this.animationManagerContainer.removeChildren();
        }
        return undefined;
    }
}
