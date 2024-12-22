import { Game } from "../scene-objects/game";

export class Timer {
    onFinishedTimer: () => void;
    timerUpdater: number;
    currentTime = 0;
    isInPauseMode = false;

    constructor(private timeLimit: number) {
        this.stopNow();
    }

    start = (onFinishedTimer: () => void) => {
        if (!this.isInPauseMode || this.isStop()) {
            this.onFinishedTimer = onFinishedTimer;
            this.currentTime = 0;
            setTimeout(this.startTimeoutToTimer, 0);
        }
        this.isInPauseMode = false;
    }

    putInPause = () => {
        this.isInPauseMode = true;
    }

    stopNow = () => {
        this.currentTime = this.timeLimit + 1;
        if (this.onFinishedTimer) {
            this.onFinishedTimer();
        }
    }

    isPause = () => {
        return this.isInPauseMode;
    }

    isStop = () => {
        return this.currentTime >= this.timeLimit;
    }

    private startTimeoutToTimer = () => this.timerUpdater = Game.instance.updateEventManager.addUpdateEvent(this.startTimer);
    private startTimer = (timestamp: number) => this.updateTimer(Game.instance.updateEventManager.deltaTime / 1000);

    private updateTimer = (deltaTime: number) => {
        if (!this.isInPauseMode && !this.isStop()) {
            this.currentTime += deltaTime;
            if (this.isStop() && this.onFinishedTimer) {
                Game.instance.updateEventManager.removeUpdateEvent(this.timerUpdater);
                this.onFinishedTimer();
            }
        }
    }
}