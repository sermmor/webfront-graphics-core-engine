// import 'core-js/modules/es7.object.values';
import { Scene } from "./scene";
import { CoreLoader } from '../wrappers/static/core-loader';
import { CoreUtils } from '../wrappers/static/core-utils';

interface SceneDictionary {
    [key: string]: Scene | undefined;
}

export class SceneManager {
    private sceneDictionary: SceneDictionary;

    constructor() {
        this.sceneDictionary = {};
    }

    get length() {
        let counter = 0;
        for (const key in this.sceneDictionary) {
            counter++;
        }
        return counter;
        // return Object.keys(this.sceneDictionary).length;
    }

    getAllSceneNames(): string[] {
        let sceneNames: string[] = [];
        for (const key in this.sceneDictionary) {
            sceneNames.push(key);
        }
        return sceneNames;
        // return Object.keys(this.sceneDictionary);
    }

    load(nameScene: string): Promise<Scene> {
        const scene: Scene = this.getScene(nameScene);
        return scene.load();
    }

    addScene(scene: Scene) {
        const sceneName = scene.name.toLowerCase();
        this.sceneDictionary[sceneName] = scene;
    }

    getScene(sceneName: string): Scene {
        return this.sceneDictionary[sceneName.toLowerCase()]!;
    }

    removeSceneOfSceneManager(sceneName: string): Scene {
        const realNameScene = sceneName.toLowerCase();
        const scene = this.sceneDictionary[realNameScene];
        this.sceneDictionary[realNameScene] = undefined;
        scene!.destroy().then(() => {
            CoreUtils.getInstance().clearTextureCache();
        });
        return scene!;
    }
    
    // async destroy(): Promise<void> {
    destroy(): Promise<void> {
        // const sceneList = Object.values(this.sceneDictionary);
        const sceneList: (Scene | undefined)[] = [];
        for (const sceneName in this.sceneDictionary) {
            sceneList.push(this.sceneDictionary[sceneName]);
        }

        if (CoreLoader.getInstance() && CoreLoader.getInstance().shared && CoreLoader.getInstance().shared.reset) {
            CoreLoader.getInstance().shared.reset();
        }

        // for (let i = 0; i < sceneList.length; i++) {
        //     await sceneList[i]!.destroy();
        // }
        // CoreLoader.getInstance().shared.reset();
        // CoreUtils.getInstance().clearTextureCache();
        // this.sceneDictionary = {};
        
        return new Promise<void>((resolve, reject) => {
            this.destroyEach(sceneList, 0, () => resolve());
        });
    }

    private destroyEach(sceneList: (Scene | undefined)[], i: number, onFinished: () => void) {
        if (i === sceneList.length) {
            if (CoreLoader.getInstance() && CoreLoader.getInstance().shared && CoreLoader.getInstance().shared.reset) {
                CoreLoader.getInstance().shared.reset();
            }
            if (CoreUtils.getInstance() && CoreUtils.getInstance().clearTextureCache) {
                CoreUtils.getInstance().clearTextureCache();
            }
            this.sceneDictionary = {};
            onFinished();
        } else {
            if (sceneList[i] && sceneList[i]!.destroy) {
                sceneList[i]!.destroy().then(() => {
                    setTimeout(() => {
                        this.destroyEach(sceneList, i + 1, onFinished);
                    }, 0);
                });
            }
        }
    }
}
