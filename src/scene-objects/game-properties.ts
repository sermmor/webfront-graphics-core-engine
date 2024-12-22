import { NgZone, UpdateEventManager } from "../common-components/update-event-manager";
import { EventEmitterGraphicsLoader } from "../common-components/event-emitter-graphics-loader";
import { DataShared } from "../shared/data-shared";

export interface GameProperties {
    imageAsssetPaths: string[];
    particlesConfigJson: ParticleConfigJson[],
    ngZone: NgZone;
    antialiasEnabled: boolean;
    pauseOnTabOrWindowChange: boolean;
    languageCode: string;
    debugProperties: DebugProperties;
    behaviourTypeList: BehaviourTypeList[];
    usePixiSpriteAnimations?: boolean;
    dataShared?: DataShared;
    updateEventManager?: UpdateEventManager;
    utilities?: Utilities;
}

export interface ParticleConfigJson {
    nameParticle: string;
    data: any;
}

export interface DebugProperties {
    isDebuggerAllowed: boolean;
    isPhysicTraceEnabled: boolean;
    debuggerColor?: number;
}

export interface Utilities {
    eventEmitterGraphicsLoader?: EventEmitterGraphicsLoader;
    onPercentLoader?: (() => void);
    onLoadingCompleted?: (() => void);
}

export interface BehaviourTypeList {
    nameClass: string;
    classType: any;
}