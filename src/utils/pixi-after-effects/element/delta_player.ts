export class ElementDeltaPlayer {
    frameRate: number;
    inFrame: number;
    outFrame: number;
    isLoop: boolean;
    isCompleted: boolean;
    updater: (frame: number) => any;
    completed: () => any;
    isPlaying: any;
    elapsedTime: any;

    constructor(frameRate: number, inFrame: number, outFrame: number, updater: ((frame: number) => any), completed: () => any) {
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

    update(deltaTime: number): void {
        if (this.frameRate === 0) {
            return;
        }
        if (!this.isPlaying) {
            return;
        }
        if (!this.elapsedTime) {
            this.elapsedTime = 0;
        }
        if (this.isCompleted) {
            return;
        }
        this.elapsedTime += deltaTime;
        let currentFrame = this.inFrame + (this.elapsedTime * this.frameRate) / 1000.0;
        if (currentFrame > this.outFrame) {
            currentFrame = this.outFrame - 0.01;
            if (this.isLoop) {
                this.elapsedTime = 0;
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
        this.isCompleted = false;
        this.isPlaying = true;
    }

    pause(): void {
        this.isPlaying = false;
    }

    resume(): void {
        this.isPlaying = true;
    }

    stop(): void {
        this.isCompleted = true;
        this.isPlaying = false;
        this.elapsedTime = 0;
        this.showFirstFrame();
    }
}
