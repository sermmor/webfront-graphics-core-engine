import { CoreConstants, CoreTicker, CoreUtils } from '.';
import { CoreLoader } from './wrappers/static/core-loader';
import { CoreFilter } from './wrappers/static/core-filters';

export class CoreEngine {
    private static instance: CoreEngine;

    constructor(private usePixiWebGl: boolean) {
        this.buildCore();
        CoreEngine.instance = this;
    }

    static getInstance(): CoreEngine {
        return this.instance;
    }

    get isPixiWebGl() {
        return this.usePixiWebGl;
    }

    changeWebGLOption(usePixiWebGl: boolean) {
        if (this.usePixiWebGl !== usePixiWebGl) {
            this.usePixiWebGl = usePixiWebGl;
            this.buildCore();
        }
    }

    private buildCore() {
        if (this.usePixiWebGl) {
            const coreConstants = new CoreConstants(this.usePixiWebGl);
            const coreUtils = new CoreUtils(this.usePixiWebGl);
            const coreTicker = new CoreTicker(this.usePixiWebGl);
            const coreLoader = new CoreLoader(this.usePixiWebGl);
            const coreFilter = new CoreFilter(this.usePixiWebGl);
        }
    }
}
