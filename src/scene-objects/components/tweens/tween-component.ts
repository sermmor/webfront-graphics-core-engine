import { Component, IComponentLifeCompleted, ITransformableComponent } from "../component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Point } from "../../../wrappers/point";
import { Equation } from "../../../math-utils/interpolation/types";
import { Game } from "../../game";
import { GameObject } from "../../game-object";

export enum TweenOption { move = "move", scale = "scale", rotate = "rotate", opacity = "opacity", callback = "callback" };

export abstract class TweenComponent extends Component implements IComponentLifeCompleted, ITransformableComponent {
    private totalTime: number;
    private pointInitialState: Point;
    private pointEndingState: Point;
    protected option: TweenOption;
    public gameObjectNameToAct: string;
    private gameObjectToAct: GameObject; // TODO: IS ASSIGNET BY NAME OF THE GAMEOBJECT ENLACED IN JSON.

    private onTweenUpdate: undefined | ((time: number, result: Point) => void);
    private onTweenFinished: undefined | ((time: number, result: Point) => void);
    private _isRunning: boolean;
    private currentTime: number;
    private currentTimePercentage: number; // From 0 to 1.
    private currentTweenResult: Point;
    private currentTweenPercentageResult: number;
    protected equation: Equation;
    private indexUpdater: number | undefined;

    get isRunning() { return this._isRunning; }

    private static calcDeltaTime = () => Game.instance.updateEventManager.deltaTime / 1000;

    constructor() {
        super();
        this.currentTweenResult = new Point();
    }

    abstract getNameComponent(): string;

    abstract setPosition(newPositionX: number, newPositionY: number): void;
    abstract setScale(newScaleX: number, newScaleY: number): void;
    abstract setRotation(newRotation: number): void;
    abstract buildTweenFunction(): Equation;
    abstract clone(): Component;

    isConfigured = () => !!this.gameObjectNameToAct;

    setConfiguration(gameObjectToAct: GameObject) {
        if (gameObjectToAct.name === this.gameObjectNameToAct) {
            this.gameObjectToAct = gameObjectToAct;
            this.equation = this.buildTweenFunction();
        }
    }

    setConfigurationPoolCase(gameObjectToAct: GameObject, nameTweenGO: string) {
        if (gameObjectToAct.name === nameTweenGO && gameObjectToAct.name.includes(this.gameObjectNameToAct)) {
            this.gameObjectToAct = gameObjectToAct;
            this.equation = this.buildTweenFunction();
        }
    }

    startOrReset = (
        onTweenUpdate?: (time: number, result: Point) => void,
        onTweenFinished?: (time: number, result: Point) => void,
    ) => {
        this.currentTime = 0;
        this.currentTimePercentage = 0;
        this.onTweenUpdate = onTweenUpdate;
        this.onTweenFinished = onTweenFinished;
        this._isRunning = true;
        if (!this.indexUpdater) {
            this.indexUpdater = Game.instance.updateEventManager.addUpdateEvent(this.onUpdateTween);
        }
    }

    private onUpdateTween = () => {
        if (this._isRunning) {
            this.currentTime += TweenComponent.calcDeltaTime();
            this.currentTimePercentage = this.currentTime / this.totalTime;
            this.currentTweenPercentageResult = this.equation(this.currentTimePercentage);
            this.runAction();
            this._isRunning = this.currentTimePercentage < 1;
            if (!this._isRunning) {
                if (this.onTweenFinished) {
                    this.onTweenFinished(this.currentTime, this.currentTweenResult);
                }
                Game.instance.updateEventManager.removeUpdateEvent(this.indexUpdater!);
                this.indexUpdater = undefined;
            }
        }
    };

    continue = () => {
        this._isRunning = true;
    }

    pause = () => {
        this._isRunning = false;
    }

    protected runAction = () => {
        this.currentTweenResult.x = (this.currentTweenPercentageResult * (this.pointEndingState.x - this.pointInitialState.x)) + this.pointInitialState.x;
        
        switch(this.option) {
            case TweenOption.move:
                this.currentTweenResult.y = (this.currentTweenPercentageResult * (this.pointEndingState.y - this.pointInitialState.y)) + this.pointInitialState.y;
                this.gameObjectToAct.setPosition(this.currentTweenResult.x, this.currentTweenResult.y, true, true);
                break;
            case TweenOption.scale:
                this.currentTweenResult.y = (this.currentTweenPercentageResult * (this.pointEndingState.y - this.pointInitialState.y)) + this.pointInitialState.y;
                this.gameObjectToAct.setScale(this.currentTweenResult.x, this.currentTweenResult.y, true);
                break;
            case TweenOption.rotate:
                this.gameObjectToAct.setRotation(this.currentTweenResult.x, true);
                break;
            case TweenOption.opacity:
                this.gameObjectToAct.setOpacity(this.currentTweenResult.x);
                break;
            case TweenOption.callback:
                this.currentTweenResult.y = (this.currentTweenPercentageResult * (this.pointEndingState.y - this.pointInitialState.y)) + this.pointInitialState.y;
                if (this.onTweenUpdate) {
                    this.onTweenUpdate(this.currentTime, this.currentTweenResult);
                } else {
                    console.error("It's needs a callback from a tween with callback mode");
                }
                break;
        }
    }

    protected getInitialResultEquation = (): {x: number, y: number} => {
        const equationResult = this.equation(this.currentTimePercentage);
        return {
            x: (equationResult * (this.pointEndingState.x - this.pointInitialState.x)) + this.pointInitialState.x,
            y: (equationResult * (this.pointEndingState.y - this.pointInitialState.y)) + this.pointInitialState.y,
        }
    }

    protected forceToInitialState() {
        this.pause();
        const initialValue = this.getInitialResultEquation();

        switch (this.option) {
            case TweenOption.move:
                this.gameObjectToAct.setPosition(initialValue.x, initialValue.y);
                break;
            case TweenOption.scale:
                this.gameObjectToAct.setScale(initialValue.x, initialValue.y);
                break;
            case TweenOption.rotate:
                this.gameObjectToAct.setRotation(initialValue.x);
                break;
            case TweenOption.callback:
                if (this.onTweenUpdate) {
                    this.onTweenUpdate(0, this.currentTweenResult);
                }
                break;
        }
    }

    destroy = (): BaseTexture | undefined => {
        this.pause();
        if (this.indexUpdater) {
            Game.instance.updateEventManager.removeUpdateEvent(this.indexUpdater);
        }
        return undefined;
    }
    
    protected cloneParentBuilder = (clone: TweenComponent): TweenComponent => {
        clone.totalTime = this.totalTime;
        clone.pointInitialState = this.pointInitialState;
        clone.pointEndingState = this.pointEndingState;
        clone.option = this.option;
        clone.gameObjectToAct = this.gameObjectToAct;
        return clone;
    }
}