import { EventEmitter } from 'events';

const percentLoader = 'percentLoader';
export const loadingCompletedNameEvent = 'loadingCompleted';

export class EventEmitterGraphicsLoader extends EventEmitter {
    private currentNumberOfAssetsLoaded: number;

    constructor(private numberOfAsset: number = 0) {
        super();
        this.currentNumberOfAssetsLoaded = 0;
    }

    onEmitLoadingInProcess(onPercentLoader: (() => void), onLoadingCompleted: (() => void)) {
        this.removeAllListeners();
        this.on(percentLoader, onPercentLoader);
        this.on(loadingCompletedNameEvent, onLoadingCompleted);
    }

    get numberOfAssets(): number {
        return this.numberOfAsset;
    }

    get numberOfLoaderAssets(): number {
        return this.currentNumberOfAssetsLoaded;
    }

    get currentProgressPercent(): number {
        return (100 * this.currentNumberOfAssetsLoaded) / this.numberOfAsset;
    }

    resetLoaderCount(numberOfAsset?: number) {
        this.currentNumberOfAssetsLoaded = 0;
        if (numberOfAsset) {
            this.numberOfAsset = numberOfAsset;
        }
    }

    addNumberOfAssets(numberOfAssetsToAdd: number) {
        this.numberOfAsset += numberOfAssetsToAdd;
    }

    emitAssetLoaded() {
        this.currentNumberOfAssetsLoaded++;
        this.emit(percentLoader);
        if (this.currentNumberOfAssetsLoaded === this.numberOfAsset) {
            this.emit(loadingCompletedNameEvent);
        }
    }

    forceLoadingCompleted() {
        this.currentNumberOfAssetsLoaded = this.numberOfAsset;
        this.emit(percentLoader);
        this.emit(loadingCompletedNameEvent);
    }
}
