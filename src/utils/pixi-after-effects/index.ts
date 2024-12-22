/**
 * @namespace PIXI
 */

// import { AfterEffects } from './AfterEffects';
// import { AEDataLoader } from './loader';
// import { AEDataInterceptor } from './interceptor';

// window.PIXI.AfterEffects = AfterEffects;
// window.PIXI.AEDataLoader = AEDataLoader;
// window.PIXI.AEDataInterceptor = AEDataInterceptor;

import { AfterEffects as AE } from './after-effects';
import { AEDataLoader as AELoader } from './loader';
import { AEDataInterceptor as AEInterceptor } from './interceptor';

export declare namespace PIXI {
    class AfterEffects extends AE {}
    class AEDataLoader extends AELoader {}
    class AEDataInterceptor extends AEInterceptor {}
}

export * from './after-effects';
export * from './loader';
export * from './interceptor';
