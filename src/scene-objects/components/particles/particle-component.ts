import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from "../component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { GameObject } from "../../game-object";
import { Container } from "../../../wrappers/container";
import { cloneJSONData } from "../../../utils/json-utils";
import { Color } from "../../../wrappers/color";
import { CoreFilter } from "../../../wrappers/static/core-filters";
import { Game } from "../../game";
import { Texture } from "../../../wrappers/texture";
import { EmitterConfig, ParticleEmitter } from "../../../wrappers/particle";
import { Point } from "../../../wrappers/point";

export class ParticleComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    public static nameComponent = "ParticleComponent";

    private startAtMilliseconds: number;
    private duration: number;
    private color: Color;
    private nameImages: string[];
    private config: EmitterConfig;
    
    private isEnabled: boolean;
    private isActivePreUpdate: boolean;
    private currentTime: number;
    private texturesPaths: Texture[];
    private _container: Container;
    private emiter: ParticleEmitter;

    get container(): Container { return this._container; }
    get isParticleStopped(): boolean { return this.currentTime >= this.duration || !this.isEnabled; }
    get totalDuration(): number {
        if (this.startAtMilliseconds) {
            return this.startAtMilliseconds + this.duration;
        } else {
            return this.duration;
        }
    }

    constructor() {
        super();
        if (!this.color) {
            this.color = new Color('(255,255,255,0)');
        }
    }

    initialize = (): void => {
        this.texturesPaths = [];
        this.nameImages.forEach(nameFile => {
            const path = this.completePath(Game.instance.propierties.imageAsssetPaths, nameFile);
            if (path) {
                this.texturesPaths.push(Texture.fromImage(path));
            }
        });
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

    load = (): Promise<Component> => {
        this._container = new Container();
        this.emiter = new ParticleEmitter(
            this._container,
            this.texturesPaths,
            this.config
        )
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
        this._container.scaleX = gameObject.transform.scale.x * sceneObjectToScreenProportion.x;
        this._container.scaleY = gameObject.transform.scale.y * sceneObjectToScreenProportion.y;
        this._container.x = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        this._container.y = gameObject.transform.position.y * sceneObjectToScreenProportion.y;
        this.setEnable(gameObject.isEnabled);
        this.setOpacity(this.color.a);
        this.applyColor(this.color, true);
        return this._container;
    }

    beginParticleUpdate = () => {
        this.currentTime = 0;
        this.isActivePreUpdate = !!this.startAtMilliseconds;
        this.setEnable(!this.isActivePreUpdate);
    }

    updateParticle = (deltaTimeInSeconds: number) => {
        this.currentTime += Game.instance.updateEventManager.deltaTime;
        if (this.isActivePreUpdate) {
            this.preUpdate(deltaTimeInSeconds);
        } else {
            this.update(deltaTimeInSeconds);
        }
    }
    private preUpdate = (deltaTimeInSeconds: number) => {
        if (this.currentTime < this.startAtMilliseconds) {
            this.emiter.update(deltaTimeInSeconds);
        } else {
            this.currentTime = 0;
            this.setEnable(true);
            this.isActivePreUpdate = false;
        }
    }
    private update = (deltaTimeInSeconds: number) => {
        if (this.currentTime < this.duration) {
            this.emiter.update(deltaTimeInSeconds);
        } else if (this.isEnabled) {
            this.setEnable(false);
        }
    }

    applyColor = (color: Color, useOnlyMatrix = false)  => {
        if (!useOnlyMatrix) {
            this.setOpacity(color.a);
            this.color.r = color.r;
            this.color.g = color.g;
            this.color.b = color.b;
        }

        if (this.color.r >= 255 && this.color.g >= 255 && this.color.b >= 255) {
            CoreFilter.instance.clearAllFilters(this._container);
        } else {
            CoreFilter.instance.applyColorMatrixFilter(this._container, this.color);
        }
    }

    setOpacity = (newAlpha: number): void => {
        this.color.a = newAlpha;
        if (this._container) {
            this._container.alpha = newAlpha;
        }
    }

    setEnable = (isEnable: boolean): void => {
        this.isEnabled = isEnable;
        if (this._container) {
            this._container.visible = isEnable;
            this._container.renderable = isEnable;
        }
    }

    getAllComponents = (nameComponent: string): Component[] | undefined => {
        return [this];
    }

    getComponent = (nameComponent: any): Component | undefined => {
        return this;
    }

    getComponentByStringType = (nameComponent: string): Component | undefined => {
        if (nameComponent === ParticleComponent.nameComponent) {
            return this;
        }
        return undefined;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return ParticleComponent.nameComponent === nameComponent;
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return ParticleComponent === typeComponent;
    }

    setRotation = (newRotation: number): void => {
        // this._container.rotation = newRotation;
        this.emiter.rotate(newRotation);
    }

    setScale = (newScaleX: number, newScaleY: number): void => {
        this._container.scale.x = newScaleX;
        this._container.scale.y = newScaleY;
    }

    /**
	 * Changes the position of the emitter's owner. You should call this if you are adding
	 * particles to the world container that your emitter's owner is moving around in.
	 * @param x The new x value of the emitter's owner.
	 * @param y The new y value of the emitter's owner.
	 */
    setPosition = (newPositionX: number, newPositionY: number): void => {
        // this._container.position.x = newPositionX;
        // this._container.position.y = newPositionY;
        this.emiter.updateOwnerPos(newPositionX, newPositionY);
    }

    getPosition = (): Point => this.emiter.ownerPosition;

    /**
	 * Changes the spawn position of the emitter.
	 * @param x The new x value of the spawn position for the emitter.
	 * @param y The new y value of the spawn position for the emitter.
	 */
    setSpawnPosition = (newPositionX: number, newPositionY: number): void => {
        this.emiter.updateSpawnPos(newPositionX, newPositionY);
    }

    getSpawnPosition = (): Point => this.emiter.spawnPosition;

    setSpawnRectangle = (newPositionX: number, newPositionY: number, newWidth: number, newHeight: number): void => {
        this.emiter.setSpawnRectangle(newPositionX, newPositionY, newWidth, newHeight);
    }

    getSpawnRectanglePosition = (): {x: number, y: number, width: number, height: number} => this.emiter.spawnRectangle;

    setSpawnCircle = (newPositionX: number, newPositionY: number, newRadius: number, newMinRadius?: number): void => {
        this.emiter.setSpawnCircle(newPositionX, newPositionY, newRadius, newMinRadius);
    }

    getSpawnCirclePosition = (): {x: number, y: number, radius: number, minRadius: number} => this.emiter.spawnCircle;

    clone = (): Component => {
        const copy = new ParticleComponent();
        copy.config = cloneJSONData(this.config);
        copy.isEnabled = this.isEnabled;
        copy.color = this.color.clone();
        copy.load();
        
        copy._container.scaleX = this._container.scaleX;
        copy._container.scaleY = this._container.scaleY;
        copy._container.x = this._container.x;
        copy._container.y = this._container.y;

        copy.setEnable(this.isEnabled);
        copy.setOpacity(copy.color.a);
        copy.applyColor(copy.color, true);

        return copy;
    }

    destroy = (): BaseTexture | undefined => {
        if (this.emiter && this._container) {
            this.emiter.destroy();
            this._container.removeChildren();
            this._container.parent.removeChild(this._container);
            (<any> this.emiter) = undefined;
            (<any> this._container) = undefined;
        }
        return undefined;
    }
}
