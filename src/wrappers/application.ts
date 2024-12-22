import { Application as PixiApplication } from 'pixi.js';
import { CoreEngine } from '../core-engine';
import { Container } from './container';
import { CoreConstants } from './static/core-constants';

interface AppOptions {
    autoStart?: boolean;
    width?: number;
    height?: number;
    view?: HTMLCanvasElement;
    transparent?: boolean;
    autoDensity?: boolean;
    antialias?: boolean;
    preserveDrawingBuffer?: boolean;
    resolution?: number;
    forceCanvas?: boolean;
    backgroundColor?: number;
    clearBeforeRender?: boolean;
    forceFXAA?: boolean;
    powerPreference?: string;
    sharedTicker?: boolean;
    sharedLoader?: boolean;
    resizeTo?: Window | HTMLElement;
}

export class Application {
    private static isPixiWebGl: boolean;
    private application: PixiApplication;
    private appStage: Container;

    constructor(options?: AppOptions) {
        Application.isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
        this.buildApplication(Application.isPixiWebGl, options);
    }

    get renderer() {
        return this.application.renderer;
    }

    get stage() {
        if (!this.appStage) {
            this.appStage = new Container(this.application.stage);
        }
        return this.appStage;
    }

    get view() {
        return this.application.view;
    }

    get ticker() {
        return this.application.ticker;
    }

    get isRendererCreated() {
        return !!this.application && !!this.application.renderer;
    }

    set stage(value: Container) {
        this.appStage = value;
        if (Application.isPixiWebGl) {
            this.application.stage = value.containerPixiWebGl;
        }
    }

    getInformationCanvas(): 'WebGL 1' | 'WebGL 2' | 'WebGL Legacy' | 'Canvas' {
        if (this.application.renderer.type === CoreConstants.getInstance().RENDERER_TYPE.WEBGL) {
            if (CoreConstants.getInstance().ENV.WEBGL === this.application.renderer.context.webGLVersion) {
                return 'WebGL 1';
            }
            if (CoreConstants.getInstance().ENV.WEBGL2 === this.application.renderer.context.webGLVersion) {
                return 'WebGL 2';
            }
            if (CoreConstants.getInstance().ENV.WEBGL_LEGACY === this.application.renderer.context.webGLVersion) {
                return 'WebGL Legacy';
            }
        }
        return 'Canvas';
    }

    runTextureGC() {
        if (this.application && this.application.renderer && this.application.renderer.textureGC && this.application.renderer.textureGC.run) {
            this.application.renderer.textureGC.run();
        }
    }

    render() {
        if (this.application && this.application.renderer) {
            this.application.render();
        }
    }

    renderContainer(container: Container) {
        if (Application.isPixiWebGl) {
            this.application.renderer.render(container.containerPixiWebGl);
        }
    }

    destroy(removeView?: boolean, stageOptions?: {
        children?: boolean;
        texture?: boolean;
        baseTexture?: boolean;
    }): void {
        if (this.application && this.application.stage) {
            this.application.destroy(removeView, stageOptions);
        }
    }

    private buildApplication(isPixiWebGl: boolean, options?: AppOptions) {
        if (isPixiWebGl) {
            this.application = new PixiApplication(options);
        }
    }
}
