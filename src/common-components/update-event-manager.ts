import { Application } from '../wrappers/application';
import { CoreTicker } from '../wrappers/static/core-ticker';
import { CoreConstants } from '../wrappers/static/core-constants';

const maxFPS = 60;
const minFPS = 30;
const minDeltaTime = 1000 / minFPS;
const maxDeltaTime = 1000 / maxFPS;
const INITIAL_INDEX_VALUE = Number.MIN_SAFE_INTEGER;

export interface NgZone {
    runOutsideAngular<T>(fn: (...args: any[]) => T): T;
}

export type OnEventToUpdate = (timestamp: number) => void;

interface EventToUpdate {
    index: number;
    timeMultiply: number;
    onEvent: OnEventToUpdate;
}

export class UpdateEventManager {
    private static currentFPS: number;

    millisecondsInLastPause: number;
    private eventsUpdater: EventToUpdate[];
    private currentTimestamp: number;
    private currentDeltaTime: number;
    private resquetAnimFrame: number;
    private isRunning: boolean;
    private isFirstFrame: boolean;
    private millisecondsWhenPauseBegins: number;
    private nextIndexEvent: number;

    constructor(
        private app: Application | undefined,
        private ngZone: NgZone,
        private pauseOnTabOrWindowChange: boolean,
        private usePixiTicker: boolean
    ) {
        this.eventsUpdater = [];
        this.millisecondsWhenPauseBegins = 0;
        this.millisecondsInLastPause = 0;
        this.nextIndexEvent = INITIAL_INDEX_VALUE;
        this.stopOnVisibilityChange(true);
        if (!this.usePixiTicker) {
            this.stopPixiTicker();
        }
        this.continue();
    }

    static getNgZone(updateEventManager: UpdateEventManager): NgZone {
        return updateEventManager.ngZone;
    }

    static getCurrentFPS(updateEventManager: UpdateEventManager | undefined, showFPSWarn = true): string {
        if (updateEventManager && !updateEventManager.usePixiTicker) {
            UpdateEventManager.currentFPS = 1000 / updateEventManager.currentDeltaTime;
            if (showFPSWarn && UpdateEventManager.currentFPS < 50) {
                console.warn(`FPS = ${UpdateEventManager.currentFPS}`);
            }
            return UpdateEventManager.currentFPS.toFixed(2);
        }
        if (CoreTicker.getInstance()) {
            return CoreTicker.getInstance().system.FPS.toFixed(2);
        }
        return '0';
    }

    get isPauseEnabled() {
        return this.pauseOnTabOrWindowChange;
    }

    get deltaTime() {
        return this.usePixiTicker ? this.app!.ticker.deltaMS : this.currentDeltaTime;
    }

    get isInPause() {
        return this.isRunning;
    }

    addUpdateEvent(onEvent: OnEventToUpdate, timeMultiply = 1): number {
        if (this.app) {
            this.app.runTextureGC();
        }
        this.nextIndexEvent++;
        this.eventsUpdater.push({ onEvent, timeMultiply, index: this.nextIndexEvent, });
        return this.nextIndexEvent;
    }

    removeUpdateEvent(eventIndex: number) {
        if (!eventIndex || !this.eventsUpdater) {
            return;
        }
        let indexToRemove = -1;
        for (let i = 0; i < this.eventsUpdater.length; i++) {
            if (this.eventsUpdater[i].index === eventIndex) {
                indexToRemove = i;
                break;
            }
        }
        this.eventsUpdater.splice(indexToRemove, 1);
        if (this.eventsUpdater.length === 0) {
            // console.log(`UPDATE EMPTY!!`)
            this.nextIndexEvent = INITIAL_INDEX_VALUE;
        }
        if (this.app) {
            try {
                this.app.runTextureGC();
            } catch (error) {
                // No hacer nada, ya que no queda textura que no esté limpiada, pues la aplicación está borrada.
            }
        }
    }

    render = () => {
        if (this.app) {
            this.app.render();
        }
    }

    destroy() {
        // cancelAnimationFrame(this.resquetAnimFrame);
        this.stopOnVisibilityChange(false);
        this.eventsUpdater = [];
        this.app = undefined;
        this.currentTimestamp = 0;
        this.currentDeltaTime = 0;
        this.isRunning = false;
        // UpdateEventManager.instance = undefined;
        // this.pause();
        (<any> this.ngZone) = undefined;
    }

    continue = () => {
        if (!this.isRunning) {
            this.isRunning = true;
            if (!this.pauseOnTabOrWindowChange && this.millisecondsWhenPauseBegins > 0) {
                this.millisecondsInLastPause = (Date.now() - this.millisecondsWhenPauseBegins);
            }
            this.currentTimestamp = 0;
            this.currentDeltaTime = 0;
            if (this.usePixiTicker && this.app && this.app.ticker) {
                this.app.ticker.minFPS = minFPS;
                this.app.ticker.maxFPS = maxFPS;
                this.app.ticker.add(this.updateCanvasByTicker, undefined, CoreConstants.getInstance().UPDATE_PRIORITY.INTERACTION);
            } else {
                this.ngZone.runOutsideAngular(() => {
                    this.resquetAnimFrame = requestAnimationFrame(this.startCanvasByAnimationFrame);
                });
            }
        }
    }

    pause = () => {
        if (this.isRunning) {
            if (!this.pauseOnTabOrWindowChange) {
                this.millisecondsWhenPauseBegins = Date.now();
            }
            this.currentTimestamp = 0;
            this.currentDeltaTime = 0;
            this.isRunning = false;
            if (this.usePixiTicker && this.app && this.app.ticker) {
                this.app.ticker.remove(this.updateCanvasByTicker);
            } else {
                this.ngZone.runOutsideAngular(() => {
                    cancelAnimationFrame(this.resquetAnimFrame);
                });
            }
        }
    }

    changeNgZone = (ngZone: NgZone): void => {
        this.pause();
        this.ngZone = ngZone;
        this.continue();
    }

    protected updateCanvasByTicker = (timestamp: number) => {
        this.isFirstFrame = this.currentTimestamp <= 0;
        this.currentTimestamp = this.app!.ticker.lastTime;

        // UpdateEventManager.getCurrentFPS();

        if (!this.isFirstFrame) {
            this.eventsUpdater.forEach(this.updateTheUpdater);
        }
    }

    protected startCanvasByAnimationFrame = (timestamp: number) => {
        if (!this.ngZone || !this.ngZone.runOutsideAngular) return;

        this.isFirstFrame = this.currentTimestamp <= 0;
        if (this.isFirstFrame) {
            this.ngZone.runOutsideAngular(this.updateTheFirstFrame);
            this.currentDeltaTime = 0;
            this.currentTimestamp = timestamp;
        } else {
            this.updateCanvasByAnimationFrame(timestamp);
        }
    }
    protected updateCanvasByAnimationFrame = (timestamp: number) => {
        if (!this.ngZone || !this.ngZone.runOutsideAngular || !this.app || !this.app.isRendererCreated) return;

        this.currentDeltaTime = timestamp - this.currentTimestamp;
        // console.log(`${timestamp} (${this.currentDeltaTime}) [${this.currentTimestamp}]`)
        this.currentTimestamp = timestamp;

        // if (this.currentDeltaTime <= minDeltaTime) {
        this.eventsUpdater.forEach(this.updateTheUpdater);
        this.render();
        // }
        this.ngZone.runOutsideAngular(this.updateTheNextFrame);
    }

    private updateTheFirstFrame = () => this.resquetAnimFrame = requestAnimationFrame(this.startCanvasByAnimationFrame);
    private updateTheNextFrame = () => this.resquetAnimFrame = requestAnimationFrame(this.updateCanvasByAnimationFrame);
    private updateTheUpdater = (updater: EventToUpdate) => updater.onEvent(this.currentTimestamp * updater.timeMultiply);

    private stopOnVisibilityChange(value: boolean) {
        const evt = this.getVisibilityChangeEvent();
        if (value && evt) {
            document.addEventListener(evt, this.onVisibilityChange);
        } else if (evt) {
            document.removeEventListener(evt, this.onVisibilityChange);
        }
    }

    private onVisibilityChange = () => {
        if (!!(document.hidden || (<any> document).webkitHidden || (<any> document).mozHidden || (<any> document).msHidden)) {
            this.pause();
        } else {
            this.continue();
        }
    }

    private getVisibilityChangeEvent() {
        if (typeof document.hidden !== 'undefined') {
            return 'visibilitychange';
        }
        if (typeof (<any> document).webkitHidden !== 'undefined') {
            return 'webkitvisibilitychange';
        }
        if (typeof (<any> document).mozHidden !== 'undefined') {
            return 'mozvisibilitychange';
        }
        if (typeof (<any> document).msHidden !== 'undefined') {
            return 'msvisibilitychange';
        }
    }

    private stopPixiTicker() {
        const allTickers = [this.app!.ticker, CoreTicker.getInstance().shared, CoreTicker.getInstance().system];
        allTickers.forEach(ticker => {
            ticker.autoStart = false;
            ticker.stop();
        });
    }
}
