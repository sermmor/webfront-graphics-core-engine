import { Ticker as PIXI_Ticker } from 'pixi.js';

export class CoreTicker {
    private static instance: CoreTicker;
    private static sharedTicker: PIXI_Ticker;
    private static systemTicker: PIXI_Ticker;

    constructor(isPixiWebGl: boolean) {
        if (isPixiWebGl) {
            CoreTicker.sharedTicker = PIXI_Ticker.shared;
            CoreTicker.systemTicker = PIXI_Ticker.system;
        }
        CoreTicker.instance = this;
    }

    get shared() {
        return CoreTicker.sharedTicker;
    }

    get system() {
        return CoreTicker.systemTicker;
    }

    static getInstance(): CoreTicker {
        return CoreTicker.instance;
    }
}
