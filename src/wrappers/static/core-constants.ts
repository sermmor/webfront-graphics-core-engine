import {
    RAD_TO_DEG as PIXI_RAD_TO_DEG,
    DEG_TO_RAD as PIXI_DEG_TO_RAD,
    UPDATE_PRIORITY as PIXI_UPDATE_PRIORITY,
    RENDERER_TYPE as PIXI_RENDERER_TYPE,
    ENV as PIXI_ENV,
    BLEND_MODES as PIXI_BLEND_MODES
} from 'pixi.js';

interface UpdatePriority {
    INTERACTION: number;
    HIGH: number;
    NORMAL: number;
    LOW: number;
    UTILITY: number;
}

interface RenderType {
    UNKNOWN: number;
    WEBGL: number;
    CANVAS: number;
}

interface Env {
    WEBGL_LEGACY: number;
    WEBGL: number;
    WEBGL2: number;
}

interface BlendModes {
    NORMAL: number;
    ADD: number;
    MULTIPLY: number;
    SCREEN: number;
    OVERLAY: number;
    DARKEN: number;
    LIGHTEN: number;
    COLOR_DODGE: number;
    COLOR_BURN: number;
    HARD_LIGHT: number;
    SOFT_LIGHT: number;
    DIFFERENCE: number;
    EXCLUSION: number;
    HUE: number;
    SATURATION: number;
    COLOR: number;
    LUMINOSITY: number;
    NORMAL_NPM: number;
    ADD_NPM: number;
    SCREEN_NPM: number;
    NONE: number;
    SRC_IN: number;
    SRC_OUT: number;
    SRC_ATOP: number;
    DST_OVER: number;
    DST_IN: number;
    DST_OUT: number;
    DST_ATOP: number;
    SUBTRACT: number;
    SRC_OVER: number;
    ERASE: number;
}

export class CoreConstants {
    private static instance: CoreConstants;
    private degToRad: number;
    private radToDeg: number;
    private updatePriority: UpdatePriority;
    private rendererType: RenderType;
    private env: Env;
    private blendModes: BlendModes;

    constructor(usePixiWebGl: boolean) {
        this.buildCommonConstants(usePixiWebGl);
        this.buildUpdatePriorityConstants(usePixiWebGl);
        this.buildRenderTypeConstants(usePixiWebGl);
        this.buildEnvConstants(usePixiWebGl);
        this.buildBlendModesConstants(usePixiWebGl);
        CoreConstants.instance = this;
    }

    get DEG_TO_RAD() {
        return this.degToRad;
    }

    get RAD_TO_DEG() {
        return this.radToDeg;
    }

    get UPDATE_PRIORITY() {
        return this.updatePriority;
    }

    get RENDERER_TYPE() {
        return this.rendererType;
    }

    get ENV() {
        return this.env;
    }

    get BLEND_MODES() {
        return this.blendModes;
    }

    static getInstance(): CoreConstants {
        return CoreConstants.instance;
    }

    private buildCommonConstants(usePixiWebGl: boolean) {
        this.radToDeg = PIXI_RAD_TO_DEG;
        this.degToRad = PIXI_DEG_TO_RAD;
    }

    private buildUpdatePriorityConstants(usePixiWebGl: boolean) {
        this.updatePriority = {
            INTERACTION: PIXI_UPDATE_PRIORITY.INTERACTION,
            HIGH: PIXI_UPDATE_PRIORITY.HIGH,
            NORMAL: PIXI_UPDATE_PRIORITY.NORMAL,
            LOW: PIXI_UPDATE_PRIORITY.LOW,
            UTILITY: PIXI_UPDATE_PRIORITY.UTILITY,
        };
    }

    private buildRenderTypeConstants(usePixiWebGl: boolean) {
        this.rendererType = {
            UNKNOWN: PIXI_RENDERER_TYPE.UNKNOWN,
            WEBGL: PIXI_RENDERER_TYPE.WEBGL,
            CANVAS: PIXI_RENDERER_TYPE.CANVAS,
        };
    }

    private buildEnvConstants(usePixiWebGl: boolean) {
        this.env = {
            WEBGL_LEGACY: PIXI_ENV.WEBGL_LEGACY,
            WEBGL: PIXI_ENV.WEBGL,
            WEBGL2: PIXI_ENV.WEBGL2,
        };
    }

    private buildBlendModesConstants(usePixiWebGl: boolean) {
        this.blendModes = {
            NORMAL: PIXI_BLEND_MODES.NORMAL,
            ADD: PIXI_BLEND_MODES.ADD,
            MULTIPLY: PIXI_BLEND_MODES.MULTIPLY,
            SCREEN: PIXI_BLEND_MODES.SCREEN,
            OVERLAY: PIXI_BLEND_MODES.OVERLAY,
            DARKEN: PIXI_BLEND_MODES.DARKEN,
            LIGHTEN: PIXI_BLEND_MODES.LIGHTEN,
            COLOR_DODGE: PIXI_BLEND_MODES.COLOR_DODGE,
            COLOR_BURN: PIXI_BLEND_MODES.COLOR_BURN,
            HARD_LIGHT: PIXI_BLEND_MODES.HARD_LIGHT,
            SOFT_LIGHT: PIXI_BLEND_MODES.SOFT_LIGHT,
            DIFFERENCE: PIXI_BLEND_MODES.DIFFERENCE,
            EXCLUSION: PIXI_BLEND_MODES.EXCLUSION,
            HUE: PIXI_BLEND_MODES.HUE,
            SATURATION: PIXI_BLEND_MODES.SATURATION,
            COLOR: PIXI_BLEND_MODES.COLOR,
            LUMINOSITY: PIXI_BLEND_MODES.LUMINOSITY,
            NORMAL_NPM: PIXI_BLEND_MODES.NORMAL_NPM,
            ADD_NPM: PIXI_BLEND_MODES.ADD_NPM,
            SCREEN_NPM: PIXI_BLEND_MODES.SCREEN_NPM,
            NONE: PIXI_BLEND_MODES.NONE,
            SRC_IN: PIXI_BLEND_MODES.SRC_IN,
            SRC_OUT: PIXI_BLEND_MODES.SRC_OUT,
            SRC_ATOP: PIXI_BLEND_MODES.SRC_ATOP,
            DST_OVER: PIXI_BLEND_MODES.DST_OVER,
            DST_IN: PIXI_BLEND_MODES.DST_IN,
            DST_OUT: PIXI_BLEND_MODES.DST_OUT,
            DST_ATOP: PIXI_BLEND_MODES.DST_ATOP,
            SUBTRACT: PIXI_BLEND_MODES.SUBTRACT,
            SRC_OVER: PIXI_BLEND_MODES.SRC_OVER,
            ERASE: PIXI_BLEND_MODES.ERASE,
        };
    }
}
