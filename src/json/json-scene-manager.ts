// import 'core-js/modules/es7.object.values';
import { Scene } from '../scene-objects/scene';
import { GameObject } from '../scene-objects/game-object';
import { SceneProperties } from '../scene-objects/scene-properties';
import { mapFromJsonObjToGameObject } from './json-gameobject-manager';
import { Injector, propiertiesInjector } from '../injection/dependency-injectors';
import { GameObjectManager } from '../scene-objects/game-object-manager';
import { cloneJSONData } from '../utils/json-utils';
import { TweenComponentManager } from '../scene-objects/components/tweens/tween-manager';
import { TemplateData } from '../scene-objects/game';
import { GameObjectTemplate } from '../templates/game-object-template';
import { BehaviourTypeList, ParticleConfigJson } from '../scene-objects/game-properties';

interface GameObjectWithChildren {
    gameObject: GameObject;
    nameChildren: string[];
}

interface PoolInfo {
    namePool: string;
    nameItem: string;
    numberItems: number;
}

const addTemplateToSceneJSON = (sceneJSON: any, typeTemplate: any, jsonDataTemplate: any) => {
    const templateGameObject = Injector.resolve<GameObjectTemplate>(typeTemplate);
    jsonDataTemplate['vars']['templateVars'] = jsonDataTemplate['template-vars'];
    propiertiesInjector(templateGameObject, jsonDataTemplate['vars']);

    const jsonToAddToScene = templateGameObject.build(jsonDataTemplate['template']);

    // Object.keys(jsonToAddToScene).forEach(nameGameObject => {
    for (const nameGameObject in jsonToAddToScene) {
        sceneJSON[nameGameObject] = jsonToAddToScene[nameGameObject];
    }
    // });
};

const parsePoolGOChildren = (gameObjectJSON: any, dataCloned: any, poolInfoGo: PoolInfo, infoList: PoolInfo[], index: number) => {
    const childrenNameList = gameObjectJSON['transform']['childrenObjects'];
    if (childrenNameList && childrenNameList.length > 0) {
        // Object.keys(childrenNameList).forEach((childrenIndex: string) => {
        for (const childrenIndex in childrenNameList) {
            const nameItem = childrenNameList[childrenIndex];
            dataCloned['transform']['childrenObjects'][childrenIndex] = `${nameItem}-${index}`;
            if (!infoList.find(info => info.nameItem === nameItem)) {
                infoList.push({
                    nameItem,
                    namePool: `${nameItem}Pool`,
                    numberItems: poolInfoGo.numberItems,
                });
            }
        }
        // });
    }
};

const parsePoolGOBehaviours = (gameObjectJSON: any, dataCloned: any, poolInfoGo: PoolInfo, infoList: PoolInfo[], index: number) => {
    const behaviourList = dataCloned['behaviourComponentList'];
    if (behaviourList && behaviourList.length > 0) {
        // Object.keys(behaviourList).forEach((behavourIndex: string) => {
        for (const behavourIndex in behaviourList) {
            const behaviour = behaviourList[behavourIndex];
            // Object.keys(behaviour).forEach((behavourName: string) => {
            for (const behavourName in behaviour) {
                const references = behaviour[behavourName]['references'];
                // Object.keys(references).forEach((referenceName: string) => {
                for (const referenceName in references) {
                    const [nameObject, typeReference] = references[referenceName].split(':');
                    if (infoList.find(info => info.nameItem === nameObject)) {
                        references[referenceName] = `${nameObject}-${index}:${typeReference}`;
                    }
                }
                // });
            }
            // });
        }
        // });
    }
};

const parseNewGameObject = (
    gameObjectName: string,
    gameObjectJSON: any,
    behaviourTypeList: BehaviourTypeList[],
    allGameObjects: GameObjectManager,
    objectsWithChildrens: GameObjectWithChildren[],
    particlesConfigJson: ParticleConfigJson[],
): GameObject => {
    const currentGameObject = mapFromJsonObjToGameObject(gameObjectName, gameObjectJSON, behaviourTypeList, particlesConfigJson);
    allGameObjects.add(currentGameObject);
    if (gameObjectJSON['transform']['childrenObjects'].length > 0) {
        objectsWithChildrens.push({
            gameObject: currentGameObject,
            nameChildren: gameObjectJSON['transform']['childrenObjects'],
        });
    }
    return currentGameObject;
};

const parseNewPoolGameObject = (
    gameObjectName: string,
    gameObjectJSON: any,
    behaviourTypeList: BehaviourTypeList[],
    allGameObjects: GameObjectManager,
    objectsWithChildrens: GameObjectWithChildren[],
    particlesConfigJson: ParticleConfigJson[],
    poolInfoGo: PoolInfo,
    infoList: PoolInfo[]
) => {
    const allPoolGameObject: GameObject[] = [];
    for (let i = 0; i < poolInfoGo.numberItems; i++) {
        const dataCloned = cloneJSONData(gameObjectJSON);
        parsePoolGOChildren(gameObjectJSON, dataCloned, poolInfoGo, infoList, i);
        parsePoolGOBehaviours(gameObjectJSON, dataCloned, poolInfoGo, infoList, i);
        allPoolGameObject.push(
            parseNewGameObject(
                `${gameObjectName}-${i}`,
                dataCloned,
                behaviourTypeList,
                allGameObjects,
                objectsWithChildrens,
                particlesConfigJson
            ));
    }
    allGameObjects.addInPool(poolInfoGo.namePool, allPoolGameObject);
};

const getPoolInfo = (poolJson: any): PoolInfo[] => {
    const infoList: PoolInfo[] = [];
    if (poolJson) {
        // Object.keys(poolJson).forEach((namePool: string) => {
        for (const namePool in poolJson) {
            const [numberItems, nameItem] = poolJson[namePool].split(':');
            infoList.push({
                namePool,
                nameItem,
                numberItems: +numberItems,
            });
        }
        // });
    }
    return infoList;
};

const mapFromJsonToSceneProperties = (gameObjectName: string, gameObjectJSON: any): [any, SceneProperties, PoolInfo[]] => {
    const poolJson = gameObjectJSON['pools'];
    const poolInfo = getPoolInfo(poolJson);
    delete gameObjectJSON['pools'];
    const scenePropierties = Injector.resolve<SceneProperties>(SceneProperties);
    propiertiesInjector(scenePropierties, gameObjectJSON);
    return [poolJson, scenePropierties, poolInfo];
};

const buildHierarchy = (objectsWithChildrens: GameObjectWithChildren[], allGameObjects: GameObjectManager) => {
    objectsWithChildrens.forEach((parent: GameObjectWithChildren) => {
        parent.nameChildren.forEach((nameChild: string) => {
            const child = allGameObjects.findByName(nameChild);
            if (child) {
                parent.gameObject.transform.addChild(child, parent.gameObject);
            }
        });
    });
};

const buildTweenReferences = (allGameObjects: GameObjectManager) => {
    allGameObjects.filterAllGameObjectWithCondition(TweenComponentManager.hasATweenComponent)
        .forEach((goWithTween: GameObject) => allGameObjects.setTweenReferences(goWithTween));
};

export const mapFromJsonToScene = (
    nameScene: string,
    sceneJSON: any,
    dataTemplates: TemplateData[],
    particlesConfigJson: ParticleConfigJson[],
    behaviourTypeList: BehaviourTypeList[]
): Scene => {
    const allGameObjects: GameObjectManager = new GameObjectManager();
    const objectsWithChildrens: GameObjectWithChildren[] = [];
    let poolJsonData;
    let sceneProperties: SceneProperties;
    let infoList: PoolInfo[] = [];

    if (dataTemplates) {
        dataTemplates.forEach(({ type, jsonData }) => addTemplateToSceneJSON(sceneJSON, type, jsonData));
    }

    // Object.keys(sceneJSON).forEach((gameObjectName: string) => {
    for (const gameObjectName in sceneJSON) {
        const gameObjectJSON = sceneJSON[gameObjectName];
        if (gameObjectName && 'gameConfiguration' === gameObjectName) {
            [poolJsonData, sceneProperties, infoList] = mapFromJsonToSceneProperties(gameObjectName, gameObjectJSON);
        } else if (gameObjectName && gameObjectJSON['transform']) {
            const poolInfoGo = infoList.find(info => info.nameItem === gameObjectName);
            if (poolInfoGo) {
                parseNewPoolGameObject(
                    gameObjectName,
                    gameObjectJSON,
                    behaviourTypeList,
                    allGameObjects,
                    objectsWithChildrens,
                    particlesConfigJson,
                    poolInfoGo,
                    infoList
                );
            } else {
                parseNewGameObject(
                    gameObjectName,
                    gameObjectJSON,
                    behaviourTypeList,
                    allGameObjects,
                    objectsWithChildrens,
                    particlesConfigJson
                );
            }
        }
    }
    // });
    buildHierarchy(objectsWithChildrens, allGameObjects);
    buildTweenReferences(allGameObjects);

    const scene = new Scene(nameScene, sceneProperties!, allGameObjects, poolJsonData);

    return scene;
};
