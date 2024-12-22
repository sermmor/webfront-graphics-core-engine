export class ElementPlayer {
    frameRate: number;
    inFrame: number;
    outFrame: number;
    isLoop: boolean;
    isCompleted: boolean;
    updater: (frame: number) => any;
    completed: () => any;
    isPlaying: any;
    firstTime: any;
    nowTime: any;

    constructor(frameRate: number, inFrame: number, outFrame: number, updater: ((frame: number) => any), completed: (() => any)) {
        this.frameRate = frameRate;
        this.inFrame = inFrame;
        this.outFrame = outFrame;
        this.isLoop = false;
        this.isCompleted = false;
        this.updater = updater;
        this.completed = completed;
    }

    showFirstFrame(): void {
        this.updater(0);
    }

    update(nowTime: number): void {
        if (this.frameRate === 0) {
            return;
        }
        if (!this.isPlaying) {
            return;
        }
        if (!this.firstTime) {
            this.firstTime = nowTime;
        }
        if (this.isCompleted) {
            return;
        }

        this.nowTime = nowTime;
        const elapsedTime = nowTime - this.firstTime;
        let currentFrame = this.inFrame + (elapsedTime * this.frameRate) / 1000.0;
        if (currentFrame > this.outFrame) {
            currentFrame = this.outFrame - 0.01;
            if (this.isLoop) {
                this.firstTime = nowTime;
            } else {
                this.isCompleted = true;
                if (this.completed) {
                    this.completed();
                }
                return;
            }
        }
        this.updater(currentFrame);
    }

    play(isLoop: boolean): void {
        this.isLoop = isLoop || false;
        this.firstTime = null;
        this.isCompleted = false;
        this.isPlaying = true;
    }

    pause(): void {
        this.isPlaying = false;
    }

    resume(): void {
        const elapsedTime = this.nowTime - this.firstTime;
        const nowTime = performance.now();
        this.firstTime = nowTime - elapsedTime;
        this.isPlaying = true;
    }

    stop(): void {
        this.firstTime = null;
        this.isCompleted = true;
        this.isPlaying = false;
        this.showFirstFrame();
    }
}
