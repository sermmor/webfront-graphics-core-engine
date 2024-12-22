import { Engine, World } from "matter-js";
import { Point } from '../wrappers/point';
import { GameObject } from './game-object';
import { Game } from './game';
import { Application } from '../wrappers/application';
import { CoreEngine } from '../core-engine';
import { Container } from '../wrappers/container';
import { SceneProperties } from './scene-properties';
import { CollisionManager } from "../physics/collision-manager";
import { GameObjectManager } from "./game-object-manager";

export class Scene {
    private _physicsEngine: Engine;
    private _application: Application;
    private _size: { width: number; height: number };
    private _sceneObjectToScreenProportion: { x: number, y: number };
    private sceneContainer: Container | undefined;
    private containerDebug: Container | undefined;
    private _collisionManager: CollisionManager;

    constructor(
        private nameScene: string,
        private sceneProperties: SceneProperties,
        private _gameObjectManager: GameObjectManager,
        poolJsonData: any,
    ) {
        this._size = { width: 0, height: 0 };
        this._sceneObjectToScreenProportion = { x: 1, y: 1};
        Game.instance.sceneManager.addScene(this);
        _gameObjectManager.injectReferencesBetweenGameObject(poolJsonData);
    }

    get name(): string { return this.nameScene; }
    get application(): Application { return this._application; }
    get size(): { width: number; height: number } { return this._size; }
    get sceneObjectToScreenProportion(): {x: number, y: number} { return this._sceneObjectToScreenProportion; }
    get physicsEngine(): Engine { return this._physicsEngine; }
    get collisionManager(): CollisionManager { return this._collisionManager; }
    get gameObjectManager(): GameObjectManager { return this._gameObjectManager; }

    destroy(deleteFromSceneManager = false): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // TODO: Destroy all relative to the scene: gameObjects, sprites, graphics, animations, canvas, fonts,...
            this.gameObjectManager.destroy();
            this.clearUnusedAssets();
            if (this.sceneContainer) {
                this.sceneContainer.removeChildren();
                this.sceneContainer = undefined;
            }
            if (this.containerDebug) {
                this.containerDebug.removeChildren();
                this.containerDebug = undefined;
            }
            if (deleteFromSceneManager) {
                Game.instance.sceneManager.removeSceneOfSceneManager(this.nameScene);
            }
            Game.instance.updateEventManager.render(); // Show the game destroyed too.
            if (this._application) {
                if (this._application.isRendererCreated && this.application.renderer && this.application.renderer.gl) {
                    // console.log(">>> PUTTING CONTEXT IN LOST!!!!");
                    this.application.renderer.gl.getExtension('WEBGL_lose_context')!.loseContext();
                }
                this._application.destroy(true);
            }
            resolve();
        });
    }

    findByName = (name: string): GameObject | undefined => this.gameObjectManager.findByName(name);
    findAllByPosition = (positionNear: Point, maxDistance: number): GameObject[] => this.gameObjectManager.findAllByPosition(positionNear, maxDistance);

    load(): Promise<Scene> {
        return new Promise<Scene>((resolve, reject) => {
            this.gameObjectManager.load().then(() => {
                Game.instance.emitSceneLoaded();
                resolve(this);
            });
        });
    }

    start(viewport: HTMLElement, size: { width?: number; height?: number }, backgroundColor?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                Game.instance.propierties.ngZone.runOutsideAngular(() => {
                    this.initializeCanvas(viewport, size, backgroundColor);
                    this.gameObjectManager.start(this.sceneContainer!, this._sceneObjectToScreenProportion, this._size, this.containerDebug);
                    this.finishingStart();
                    resolve();
                });
            }, 0);
        });
    }

    private initializeCanvas = (viewport: HTMLElement, size: { width?: number; height?: number }, backgroundColor?: string) => {
        this._physicsEngine = Engine.create();
        this.buildCanvas(viewport, size, backgroundColor);
        // this.clearAllTextures();
        this.clearUnusedAssets();
        Game.instance.buildUpdateEventManager(this._application);
        this.sceneContainer = new Container();
        this._application.stage.addChild(this.sceneContainer!);
        if (Game.instance.propierties.debugProperties.isDebuggerAllowed) {
            this.containerDebug = new Container();
            this._application.stage.addChild(this.containerDebug!);
        }
    }

    private finishingStart = () => {
        Game.instance.updateEventManager.render();
        World.add(this._physicsEngine.world, this.gameObjectManager.findAllBodiesInAllGameObject());
        Engine.run(this._physicsEngine);
        this._collisionManager = new CollisionManager(this.gameObjectManager, this._physicsEngine);
        this.gameObjectManager.addPhysicsEngine(this._physicsEngine);
    }

    private buildCanvas(viewport: HTMLElement, size: { width?: number; height?: number }, backgroundColor?: string) {
        const resolution = window.devicePixelRatio || 1;
        const { width, height } = this.calcScreenSize(viewport, size);
        this.calcScreenProportion();

        const canvas: HTMLCanvasElement = document.createElement('canvas');
        canvas.style.height = `${height}px`;
        canvas.style.width = `${width}px`;
        if (backgroundColor) {
            canvas.style.backgroundColor = backgroundColor;
        }
        viewport.appendChild(canvas);

        //console.log(`Size canvas: ${width}, ${height}`);

        try {
            // canvas.addEventListener("webglcontextlost", function(event) {
            //     // To chec when the context is lost.
            //     event.preventDefault();
            //     console.error(">>> context lost!!!");
            // }, false);

            this._application = new Application({
                width,
                height,
                resolution,
                view: canvas,
                autoStart: true,
                antialias: Game.instance.propierties.antialiasEnabled,
                transparent: true,
            });
        } catch (ex) {
            if (!canvas.getContext('webgl2') && !canvas.getContext('webgl') && canvas.getContext('2d')) {
                CoreEngine.getInstance().changeWebGLOption(false);
                console.error('WebGL not supported, please, enable hardware acceleration in your browser.');
            } else {
                console.error('Error while canvas is creating.');
            }
        }
    }

    private calcScreenSize(viewport: HTMLElement, size: { width?: number; height?: number }): {width: number, height: number} {
        const widthSugerence = this._size.width = size!.width || viewport.offsetWidth;
        const heightSugerence = this._size.height = size!.height || viewport.offsetHeight;
        
        // Search size using sceneProperties proportions for base (so we always going to scale the canvas inside the div).
        const proportionWidth = widthSugerence / this.sceneProperties.width;
        const proportionHeight = heightSugerence / this.sceneProperties.height;
        const proportion = Math.min(proportionWidth, proportionHeight);

        const width = this.sceneProperties.width * proportion;
        const height = this.sceneProperties.height * proportion;

        this._size = { width, height };
        return this._size;
    }

    private calcScreenProportion() {
        this._sceneObjectToScreenProportion = {
            x: this.size.width / this.sceneProperties.width,
            y: this.size.height / this.sceneProperties.height,
        };
    }

    clearUnusedAssets() {
        if (this._application) {
            this._application.runTextureGC();
        }
    }
}