import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from "../component";
import { ParticleComponent } from "./particle-component";
import { GameObject } from "../../game-object";
import { Container } from "../../../wrappers/container";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Color } from "../../../wrappers/color";
import { Game } from "../../game";
import { Point } from "../../../wrappers/point";

export class ParticleComponentManager extends Component implements IComponentLifeCompleted, ITransformableComponent, ITypeableComponent,
        IViewableComponent, IBuilderComponent {
    public static nameComponent = "ParticleComponentManager";
    
    private particleManagerContainer: Container;
    private particleUpdater: number;
    private currentTimeAllParticles: number;
    private totalTimeParticles: number;

    private temporal = {
        currentParticle: <ParticleComponent | undefined> undefined,
        onParticleFinished: <(() => void) | undefined> undefined,
        deltaTimeInSeconds: 0,
        pointListToReturn: <Point[]> [],
    };

    get isAllParticlesStopped(): boolean {
        for (this.temporal.currentParticle of this.particleComponentList) {
            if (!this.temporal.currentParticle.isParticleStopped) {
                return false;
            }
        }
        return true;
    };

    constructor(private particleComponentList: ParticleComponent[]) {
        super();
    }

    initialize = (): void  => {
        this.totalTimeParticles = 0;
        this.particleComponentList.forEach((p: ParticleComponent) => {
            this.totalTimeParticles = Math.max(this.totalTimeParticles, p.totalDuration);
            p.initialize();
        });
    }

    load = (): Promise<Component>  => {
        this.particleComponentList.forEach((p: ParticleComponent) => p.load());
        return new Promise<Component>((resolve, reject) => resolve(this));
    }

    buildAndPlace = (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: { x: number; y: number; },
        size: { width: number; height: number },
        containerDebug: Container | undefined
    ): Container => {
        this.particleManagerContainer = new Container();
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.particleManagerContainer.addChild(
                this.temporal.currentParticle.buildAndPlace(gameObject, sceneContainer, parent, sceneObjectToScreenProportion, size, containerDebug)
            );
        }
        return this.particleManagerContainer;
    }

    getParticleAtIndex = (i: number): ParticleComponent | undefined => {
        if (i < this.particleComponentList.length) {
            return this.particleComponentList[i];
        }
        return undefined;
    }

    start = (onParticleFinished?: (() => void)) => {
        this.temporal.deltaTimeInSeconds = 0;
        this.temporal.onParticleFinished = onParticleFinished;
        this.currentTimeAllParticles = 0;
        this.particleComponentList.forEach(this.beginUpdatingAllParticles);
        this.particleUpdater = Game.instance.updateEventManager.addUpdateEvent(this.updatingAllParticles);
    }
    private beginUpdatingAllParticles = (p: ParticleComponent) => p.beginParticleUpdate();
    private updatingAllParticles = () => {
        if (Game.instance.updateEventManager) {
            this.temporal.deltaTimeInSeconds = Game.instance.updateEventManager.deltaTime * .001;
            this.particleComponentList.forEach(this.updatingParticle);
            this.currentTimeAllParticles += Game.instance.updateEventManager.deltaTime;
            if (this.currentTimeAllParticles >= this.totalTimeParticles && this.isAllParticlesStopped) {
                this.stop();
                if (this.temporal.onParticleFinished) {
                    this.temporal.onParticleFinished();
                }
            }
        } else if (this.temporal.onParticleFinished) {
            this.temporal.onParticleFinished();
        }
    }
    private updatingParticle = (p: ParticleComponent) => p.updateParticle(this.temporal.deltaTimeInSeconds);

    stop = () => Game.instance.updateEventManager.removeUpdateEvent(this.particleUpdater);
    
    applyColor = (color: Color, useOnlyMatrix = false)  => {
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.applyColor(color, useOnlyMatrix);
        }
    }

    setOpacity = (newAlpha: number): void  => {
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.setOpacity(newAlpha);
        }
    }

    setEnable = (isEnable: boolean): void  => {
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.setEnable(isEnable);
        }
        if (!isEnable) {
            this.stop();
        }
    }

    getAllComponents = (nameComponent: string): Component[] | undefined  => {
        if (nameComponent === ParticleComponent.nameComponent) {
            return this.particleComponentList;
        } else if (nameComponent === ParticleComponentManager.nameComponent) {
            return [this];
        }
    }

    getComponent = (nameComponent: any): Component | undefined  => {
        if (nameComponent === ParticleComponent) {
            return (this.particleComponentList.length > 0) ? this.particleComponentList[0] : undefined;
        } else if (nameComponent === ParticleComponentManager) {
            return this;
        }
    }

    getComponentByStringType = (nameComponent: string): Component | undefined  => {
        if (nameComponent === ParticleComponent.nameComponent) {
            return (this.particleComponentList.length > 0) ? this.particleComponentList[0] : undefined;
        } else if (nameComponent === ParticleComponentManager.nameComponent) {
            return this;
        }
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean  => {
        return nameComponent === ParticleComponent.nameComponent || nameComponent === ParticleComponentManager.nameComponent;
    }

    isMyTypeComponent = (typeComponent: any): boolean  => {
        return typeComponent === ParticleComponent || typeComponent === ParticleComponentManager;
    }

    setRotation = (newRotation: number): void  => {
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.setRotation(newRotation);
        }
    }

    setScale = (newScaleX: number, newScaleY: number): void  => {
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.setScale(newScaleX, newScaleY);
        }
    }

    setPosition = (newPositionX: number, newPositionY: number): void  => {
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.setPosition(newPositionX, newPositionY);
        }
    }

    getPositions = (): Point[] => {
        this.temporal.pointListToReturn = [];
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.pointListToReturn.push(this.temporal.currentParticle.getPosition());
        }
        return this.temporal.pointListToReturn;
    }

    clone = (): Component  => {
        const clone = new ParticleComponentManager(this.particleComponentList.map(p => <ParticleComponent> p.clone()));
        clone.particleManagerContainer = new Container();
        clone.particleComponentList.forEach(p => {
            clone.particleManagerContainer.addChild(p.container);
        })
        return clone;
    }

    destroy = (): BaseTexture | undefined  => {
        this.stop();
        for (this.temporal.currentParticle of this.particleComponentList) {
            this.temporal.currentParticle.destroy();
        }
        this.particleManagerContainer.removeChildren();
        if (this.particleManagerContainer.parent) {
            this.particleManagerContainer.parent.removeChild(this.particleManagerContainer);
        }
        return undefined;
    }
}
