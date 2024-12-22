import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IParcialLifeCircleComponent } from "../component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { TweenComponent } from "./tween-component";
import { Point } from "../../../wrappers/point";
import { GameObject } from "../../game-object";
import { BezierTweenComponent } from "./bezier-tween-component";
import { BezierCubicTweenComponent } from "./bezier-cubic-tween-component";
import { LagrangeTweenComponent } from "./lagrange-tween-component";
import { AkimaCubicSplineTweenComponent } from "./akima-cubic-spline-tween-component";

type OnTweenUpdate = (time: number, result: Point) => void;

/**
 * Execute all its tweens in a parallel way (not sequence).
 */
export class TweenComponentManager extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IParcialLifeCircleComponent {
    private static typeNameOfTweens: string[] = ["BezierTweenComponent", "BezierCubicTweenComponent", "LagrangeTweenComponent", "AkimaCubicSplineTweenComponent"];
    private static typeOfTweens: any[] = [BezierTweenComponent, BezierCubicTweenComponent, LagrangeTweenComponent, AkimaCubicSplineTweenComponent];

    static hasATweenComponent = (go: GameObject): boolean => {
        for (let i = 0; i < TweenComponentManager.typeNameOfTweens.length; i++) {
            if (go.getComponentByStringType(TweenComponentManager.typeNameOfTweens[i]) !== undefined) {
                return true;
            }
        }
        return false;
    }

    private tweenComponentList: TweenComponent[];
    private currentTweenInSequence: TweenComponent | undefined;
    private currentIndexTweenExecuting: number;

    private temporal = {
        transformToChange: { x: 0, y: 0 },
        onFilter: <undefined | ((t: TweenComponent) => boolean)> undefined,
        onTweenUpdateConfig: <undefined | ((t: TweenComponent) => (OnTweenUpdate | undefined))> undefined,
        onTweenFinished: <undefined | ((t: TweenComponent) => (OnTweenUpdate | undefined))> undefined,
        tweenUpdate: <undefined | OnTweenUpdate> undefined,
        tweenFinished: <undefined | OnTweenUpdate> undefined,
        typeTween: <any> TweenComponent,
    }

    constructor(tweenComponentList?: TweenComponent[], private isInParallelExecutionTweenMode = true) {
        super();
        this.tweenComponentList = tweenComponentList? tweenComponentList : [];   
        this.currentIndexTweenExecuting = -1;     
        // const typesToAddWithRepetitions = this.tweenComponentList.map(t => t.getNameComponent()).filter(type => !TweenComponentManager.typeOfTweens.includes(type));
        // if (typesToAddWithRepetitions.length > 0) {
        //     const typesToAdd: string[] = [];
        //     typesToAddWithRepetitions.forEach((type) => {
        //         if (!typesToAdd.includes(type)) typesToAdd.push(type);
        //     })
        //     TweenComponentManager.typeOfTweens = TweenComponentManager.typeOfTweens.concat(typesToAdd);
        // }
    }

    private applyfilterTween = (t: TweenComponent): boolean => !this.temporal.onFilter || this.temporal.onFilter(t);

    pauseAll = (onPauseFilter?: (t: TweenComponent) => boolean) => {
        if (this.isInParallelExecutionTweenMode) {
            this.temporal.onFilter = onPauseFilter;
            this.tweenComponentList.filter(this.applyfilterTween).forEach(this.pauseTween);
        } else if (this.currentIndexTweenExecuting > -1) {
            this.tweenComponentList[this.currentIndexTweenExecuting].pause();
        }
    }
    private pauseTween = (t: TweenComponent) => t.pause();
    
    continueAll = (onContinueFilter?: (t: TweenComponent) => boolean) => {
        if (this.isInParallelExecutionTweenMode) {
            this.temporal.onFilter = onContinueFilter;
            this.tweenComponentList.filter(this.applyfilterTween).forEach(this.continueTween);
        } else if (this.currentIndexTweenExecuting > -1) {
            this.tweenComponentList[this.currentIndexTweenExecuting].continue();
        }
    }
    private continueTween = (t: TweenComponent) => t.continue();

    startOrResetAll = (
        onStartOrResetFilter?: (t: TweenComponent) => boolean,
        onTweenUpdateConfig?: (t: TweenComponent) => (OnTweenUpdate | undefined),
        onTweenFinished?: (t: TweenComponent) => (OnTweenUpdate | undefined)
    ) => {
        if (this.isInParallelExecutionTweenMode) {
            this.temporal.onFilter = onStartOrResetFilter;
            this.temporal.onTweenUpdateConfig = onTweenUpdateConfig;
            this.temporal.onTweenFinished = onTweenFinished;
            this.tweenComponentList.filter(this.applyfilterTween).forEach(this.startOrResetTween);
        } else {
            this.startOrResetAllTweenSequence(onTweenUpdateConfig, onTweenFinished);
        }
    }
    private startOrResetTween = (t: TweenComponent) => {
        this.temporal.tweenUpdate = this.temporal.onTweenUpdateConfig ? this.temporal.onTweenUpdateConfig(t) : undefined;
        this.temporal.tweenFinished = this.temporal.onTweenFinished ? this.temporal.onTweenFinished(t) : undefined;
        t.startOrReset(this.temporal.tweenUpdate, this.temporal.tweenFinished);
    }
    private startOrResetAllTweenSequence = (
        onTweenUpdateConfig?: (t: TweenComponent) => (OnTweenUpdate | undefined),
        onTweenFinished?: (t: TweenComponent) => (OnTweenUpdate | undefined)
    ) => {
        if (this.currentIndexTweenExecuting < 0) {
            this.currentIndexTweenExecuting = 0; // Sequence begins.
            this.currentTweenInSequence = this.tweenComponentList[0];
        } else {
            if (this.tweenComponentList[this.currentIndexTweenExecuting].isRunning) {
                this.currentIndexTweenExecuting++; // Current finished, so execute next tween in sequence.
                this.currentTweenInSequence = (this.currentIndexTweenExecuting < this.tweenComponentList.length) ?
                    this.tweenComponentList[this.currentIndexTweenExecuting]
                    : undefined;
            }
        }
        if (this.currentTweenInSequence) {
            this.temporal.tweenUpdate = onTweenUpdateConfig ? onTweenUpdateConfig(this.currentTweenInSequence) : undefined;
            this.temporal.tweenFinished = onTweenFinished ? onTweenFinished(this.currentTweenInSequence) : undefined;
            this.currentTweenInSequence.startOrReset(this.temporal.tweenUpdate, this.temporal.tweenFinished);
        }
    }

    setConfigurationAll = (gameObjectToAct: GameObject) => {
        this.tweenComponentList.forEach(t => t.setConfiguration(gameObjectToAct));
    }

    filterWithoutConfigure = (): TweenComponent[] => {
        return this.tweenComponentList.filter(t => t.isConfigured());
    }

    forceToEndCircleOfLife = () => this.destroy();
    
    setPosition = (newPositionX: number, newPositionY: number): void => {
        this.temporal.transformToChange.x = newPositionX;
        this.temporal.transformToChange.y = newPositionY;
        this.tweenComponentList.forEach(this.setPositionTween);
    }
    private setPositionTween = (t: TweenComponent) => t.setPosition(this.temporal.transformToChange.x, this.temporal.transformToChange.y);

    setScale = (newScaleX: number, newScaleY: number): void => {
        this.temporal.transformToChange.x = newScaleX;
        this.temporal.transformToChange.y = newScaleY;
        this.tweenComponentList.forEach(this.setScaleTween);
    }
    private setScaleTween = (t: TweenComponent) => t.setScale(this.temporal.transformToChange.x, this.temporal.transformToChange.y);

    setRotation = (newRotation: number): void => {
        this.temporal.transformToChange.x = newRotation;
        this.tweenComponentList.forEach(this.setRotationTween);
    }
    private setRotationTween = (t: TweenComponent) => t.setRotation(this.temporal.transformToChange.x);

    private getTweenTypeByName = (nameComponent: string): any => {
        if (nameComponent === "BezierTweenComponent") {
            return BezierTweenComponent;
        } else if (nameComponent === "BezierCubicTweenComponent") {
            return BezierCubicTweenComponent;
        } else if (nameComponent === "LagrangeTweenComponent") {
            return LagrangeTweenComponent;
        } else if (nameComponent === "AkimaCubicSplineTweenComponent") {
            return AkimaCubicSplineTweenComponent;
        }
        return undefined;
    }
    
    getComponentByStringType = (nameComponent: string): TweenComponent | undefined => {
        this.temporal.typeTween = this.getTweenTypeByName(nameComponent);
        return this.tweenComponentList.find(this.getComponentByTypeTween);
    }
    private getComponentByTypeTween = (t: TweenComponent) => t instanceof this.temporal.typeTween;

    getComponent = (typeComponent: any): TweenComponent | undefined => {
        this.temporal.typeTween = typeComponent;
        return this.tweenComponentList.find(this.getComponentByTypeTween);
    }

    getAllComponents = (typeComponent: any): TweenComponent[] => {
        this.temporal.typeTween = typeComponent;
        return this.tweenComponentList.filter(this.getComponentByTypeTween);
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return TweenComponentManager.typeOfTweens.includes(typeComponent);
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return TweenComponentManager.typeNameOfTweens.includes(nameComponent);
    }

    setEnable = (isEnable: boolean) => {
        if (isEnable) {
            this.continueAll();
        } else {
            this.pauseAll();
        }
    };

    destroy = (): BaseTexture | undefined => {
        this.tweenComponentList.forEach(this.destroyTween);
        this.tweenComponentList = [];
        return undefined;
    }
    private destroyTween = (t: TweenComponent) => t.destroy();

    clone = (): Component => {
        const clone = new TweenComponentManager();
        clone.tweenComponentList = <TweenComponent[]> this.tweenComponentList.map(this.cloneTween);
        return clone;
    }
    private cloneTween = (t: TweenComponent) => t.clone();
}
