import { SceneManager } from "./scene-manager";
import { GameProperties } from "./game-properties";
import { mapFromJsonToScene } from "../json/json-scene-manager";
import { CoreEngine } from "../core-engine";
import { Scene } from "./scene";
import { CoreUtils } from "../wrappers/static/core-utils";
import { validateLanguageCode } from "../utils/localization";
import { NgZone, UpdateEventManager } from "../common-components/update-event-manager";
import { Application } from "../wrappers/application";
import { EventEmitterGraphicsLoader } from "../common-components/event-emitter-graphics-loader";
import { cloneJSONData } from "../utils/json-utils";

interface SceneData {
    nameScene: string;
    jsonData: any;
}

export interface TemplateData {
    nameTemplate: string;
    gameSceneToApply: string;
    type: any;
    jsonData: any;
}

export class Game {
    private static _instance: Game;
    
    private _sceneManager: SceneManager;
    private loadingLastSceneCompleted: boolean;
    
    static get instance(): Game {
        return Game._instance!;
    }
    
    constructor(dataScenes: SceneData[], dataTemplates: TemplateData[], private _properties: GameProperties) {
        Game._instance = this;
        const core = new CoreEngine(true);
        CoreUtils.getInstance().skipHello();
        
        this._properties.languageCode = validateLanguageCode(this._properties.languageCode);
        this.settingDebugger();

        this._sceneManager = new SceneManager();
        const cloneDataTemplatesByObjects: {[name: string]: TemplateData[]} = {};
        
        dataTemplates.forEach(data => {
            if (!cloneDataTemplatesByObjects[data.gameSceneToApply]) {
                cloneDataTemplatesByObjects[data.gameSceneToApply] = [];
            }
            cloneDataTemplatesByObjects[data.gameSceneToApply].push(
                {
                    nameTemplate: data.nameTemplate,
                    gameSceneToApply: data.gameSceneToApply,
                    type: data.type,
                    jsonData: cloneJSONData(data.jsonData),
                }
            )
        });

        dataScenes.forEach(({nameScene, jsonData}) => {
            mapFromJsonToScene(
                nameScene,
                cloneJSONData(jsonData),
                cloneDataTemplatesByObjects[nameScene],
                this._properties.particlesConfigJson,
                this._properties.behaviourTypeList
            );
        });
    }

    private settingDebugger = () => {
        if (!this._properties.debugProperties.debuggerColor) {
            this._properties.debugProperties.debuggerColor = 0x00FF00;
        }
    }

    get sceneManager() { return this._sceneManager; }
    get propierties() { return this._properties; }
    get dataShared() { return this._properties.dataShared; }
    get updateEventManager(): UpdateEventManager { return this._properties.updateEventManager!; }
    get totalAssetsToLoad(): number {
        return this.propierties.utilities!.eventEmitterGraphicsLoader ?
            this.propierties.utilities!.eventEmitterGraphicsLoader!.numberOfAssets
            : 0;
    }
    get totalAssetsLoaded(): number {
        return this.propierties.utilities!.eventEmitterGraphicsLoader ?
            this.propierties.utilities!.eventEmitterGraphicsLoader!.numberOfLoaderAssets
            : 0;
    }
    get currentLoadingProgressPercent(): number {
        return this.propierties.utilities!.eventEmitterGraphicsLoader ?
            this.propierties.utilities!.eventEmitterGraphicsLoader!.currentProgressPercent
            : 0;
    }

    buildUpdateEventManager(applicationScene: Application): UpdateEventManager {
        if (this._properties.updateEventManager) {
            this._properties.updateEventManager.destroy();
            this._properties.updateEventManager = undefined;
        }

        if (this._properties.usePixiSpriteAnimations === undefined) this._properties.usePixiSpriteAnimations = false;

        return this._properties.updateEventManager = new UpdateEventManager(
            applicationScene,
            this._properties.ngZone, 
            this._properties.pauseOnTabOrWindowChange,
            this._properties.usePixiSpriteAnimations,
        );
    }

    load(nameScene: string): Promise<Scene> {
        this.settingUtilities();
        return new Promise<Scene>((resolve, reject) => {
            this._sceneManager.load(nameScene).then((scene) => {
                resolve(scene);
            });
        });
        // return await this._sceneManager.load(nameScene);
    }

    private settingUtilities = () => {
        if (this.propierties.utilities && this.propierties.utilities.onLoadingCompleted && this.propierties.utilities.onPercentLoader) {
            this.loadingLastSceneCompleted = false;
            let scene;
            let numberTotalObject = 0;
            this._sceneManager.getAllSceneNames().forEach(sceneName => {
                scene = this._sceneManager.getScene(sceneName);
                numberTotalObject += scene.gameObjectManager.getTotalLoadableGameObjects();
            });
            this.propierties.utilities.eventEmitterGraphicsLoader = new EventEmitterGraphicsLoader(numberTotalObject);
            this.propierties.utilities.eventEmitterGraphicsLoader.onEmitLoadingInProcess(
                this.propierties.utilities.onPercentLoader,
                () => {
                    this.loadingLastSceneCompleted = true;
                    this.propierties.utilities!.onLoadingCompleted!();
                },
            );
        }
    }

    emitAssetLoaded(): void {
        if (this.propierties.utilities!.eventEmitterGraphicsLoader) {
            this.propierties.utilities!.eventEmitterGraphicsLoader!.emitAssetLoaded();
        }
    }

    emitSceneLoaded(): void {
        if (!this.loadingLastSceneCompleted && this.propierties.utilities!.eventEmitterGraphicsLoader) {
            this.propierties.utilities!.eventEmitterGraphicsLoader!.forceLoadingCompleted();
        }
    }

    destroy(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this._sceneManager.destroy().then(() => {
                // TODO: Destroy all game information too.
                this.loadingLastSceneCompleted = false;
                (<any> this._sceneManager) = undefined;
                (<any> Game._instance) = undefined;
                
                if (this._properties) {
                    if (this._properties.updateEventManager) {
                        this._properties.updateEventManager.destroy();
                        this._properties.updateEventManager = undefined;
                    }
                    (<any> this._properties.particlesConfigJson) = undefined;
                    (<any> this._properties.ngZone) = undefined;
                    (<any> this._properties.dataShared) = undefined;
                    (<any> this._properties) = undefined;
                }
                resolve();
            });
        })
    }

    destroyScene = (scene: Scene, newNgZone?: NgZone): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            if (scene) {
                scene.destroy(true).then(() => {
                    if (newNgZone) {
                        this.changeNgZone(newNgZone);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    changeNgZone = (ngZone: NgZone): void => {
        if (!this._properties.updateEventManager) {
            console.error("UpdateEventManager isn't created in the game.");
        }
        this._properties.updateEventManager!.changeNgZone(ngZone);
        this._properties.ngZone = ngZone;
    }

    reset(dataScenes: SceneData[], dataTemplates: TemplateData[], _properties: GameProperties): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.destroy().then(r => {
                setTimeout(() => {
                    this._properties = _properties;

                    Game._instance = this;
                    const core = new CoreEngine(true);
                    CoreUtils.getInstance().skipHello();
                    
                    this._properties.languageCode = validateLanguageCode(this._properties.languageCode);
                    this.settingDebugger();

                    this._sceneManager = new SceneManager();
                    const cloneDataTemplatesByObjects: {[name: string]: TemplateData[]} = {};
                    
                    dataTemplates.forEach(data => {
                        if (!cloneDataTemplatesByObjects[data.gameSceneToApply]) {
                            cloneDataTemplatesByObjects[data.gameSceneToApply] = [];
                        }
                        cloneDataTemplatesByObjects[data.gameSceneToApply].push(
                            {
                                nameTemplate: data.nameTemplate,
                                gameSceneToApply: data.gameSceneToApply,
                                type: data.type,
                                jsonData: cloneJSONData(data.jsonData),
                            }
                        )
                    });

                    dataScenes.forEach(({nameScene, jsonData}) => {
                        mapFromJsonToScene(
                            nameScene,
                            cloneJSONData(jsonData),
                            cloneDataTemplatesByObjects[nameScene],
                            this._properties.particlesConfigJson,
                            this._properties.behaviourTypeList
                        );
                    });

                    resolve();
                }, 1000);
            });
        });
    }
}
