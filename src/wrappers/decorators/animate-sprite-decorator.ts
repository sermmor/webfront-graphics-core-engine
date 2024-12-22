import { AnimatedSprite } from 'pixi.js';
import { Game } from '../../scene-objects/game';

export class AnimatedSpriteDecorator extends AnimatedSprite {
    private currentDeltaTime: number;
    private _indexUpdater: number;

    private updateDecorator = (timespan: number) => {
        if (Game.instance.updateEventManager) {
            this.currentDeltaTime = Game.instance.updateEventManager.deltaTime / 15;

            try {
                this.update(this.currentDeltaTime);
            } catch (error) {
                try {
                    this.stop();
                } catch (errorToStop) {
                    // No hacer nada, ya que la textura ha sido borrada, y no debe volver a pasar por el update.
                }
            }
        }
    }

    // @ts-ignore
    get autoUpdate(): boolean {
        return <boolean> (<any>this)["_autoUpdate"];
    }

    set autoUpdate(value: boolean) {
        if (value !== (<any>this)["_autoUpdate"]) {
            (<any>this)["_autoUpdate"] = value;
            if (!(<any>this)["_autoUpdate"] && (<any>this)["_isConnectedToTicker"]) {
                Game.instance.updateEventManager.removeUpdateEvent(this._indexUpdater);
                (<any>this)["_isConnectedToTicker"] = false;
            }
            else if ((<any>this)["_autoUpdate"] && !(<any>this)["_isConnectedToTicker"] && (<any>this)["_playing"]) {
                this._indexUpdater = Game.instance.updateEventManager.addUpdateEvent(this.updateDecorator);
                (<any>this)["_isConnectedToTicker"] = true;
            }
        }
    }

    public play() {
        if ((<any>this)["_playing"]) {
            return;
        }
        (<any>this)["_playing"] = true;
        if ((<any>this)["_autoUpdate"] && !(<any>this)["_isConnectedToTicker"]) {
            this._indexUpdater = Game.instance.updateEventManager.addUpdateEvent(this.updateDecorator);
            (<any>this)["_isConnectedToTicker"] = true;
        }
    }

    public stop() {
        if (!(<any>this)["_playing"]) {
            return;
        }
        (<any>this)["_playing"] = false;
        if ((<any>this)["_autoUpdate"] && (<any>this)["_isConnectedToTicker"]) {
            Game.instance.updateEventManager.removeUpdateEvent(this._indexUpdater);
            (<any>this)["_isConnectedToTicker"] = false;
        }
    }
}