import { EventEmitter } from 'events';

export const finishedBarrierEvent = 'completed';

export class Barrier extends EventEmitter {
    private currentHeight: number;
    constructor(private maxHeight?: number) {
        super();
    }

    start(maxHeight: number) {
        this.maxHeight = maxHeight;
        this.currentHeight = this.maxHeight;
    }

    upBarrier() {
        this.currentHeight++;
        if (this.currentHeight > this.maxHeight!) {
            this.currentHeight = this.maxHeight!;
        }
    }

    downHeight() {
        this.currentHeight--;
        if (this.currentHeight <= 0) {
            this.emit(finishedBarrierEvent);
        }
    }
}
