import { Body, Engine } from "matter-js";
import { GameObject } from "./game-object";
import { BaseTexture } from "../wrappers/base-texture";
import { Point } from "../wrappers/point";
import { distanceVector2 } from "../math-utils/math-extensions";
import { Game } from "./game";
import { Container } from "../wrappers/container";
import { BehaviourComponent } from "./components/behaviour/behaviour-component";
import { flatArray } from "../utils/array-utils";
import { PoolGameObjectManager } from "./pools/pool-game-object-manager";
import { PoolGameObject } from "./pools/pool-game-object";

export class GameObjectManager {
    private allGameObjects: GameObject[] = [];
    private poolManager: PoolGameObjectManager = new PoolGameObjectManager();

    load(): Promise<void> {
        this.sortGameObjectsInZOrder();
        // for(let i = 0; i < this.allGameObjects.length; i++) {
        //     const go = await this.allGameObjects[i].load();
        //     if (go.hasABuilderComponent) {
        //         Game.instance.emitAssetLoaded();
        //     }
        // }
        return new Promise<void>((resolve, reject) => this.loadEach(0, () => resolve()));
    }

    private loadEach = (i: number, onFinished: () => void) => {
        if (i === this.allGameObjects.length) {
            onFinished();
        } else {
            this.allGameObjects[i].load().then((go) => {
                if (go.hasABuilderComponent) {
                    Game.instance.emitAssetLoaded();
                }
                
                setTimeout(() => {
                    this.loadEach(i + 1, onFinished);
                }, 0);
            })
        }
    }
    
    private sortGameObjectsInZOrder() {
        // Reverse Z order, because Z in Pixi is reverse than common logic.
        return this.allGameObjects.sort((go1, go2) => go2.transform.z - go1.transform.z);
    }

    injectReferencesBetweenGameObject = (poolJsonData: any) => {
        this.findAllWithBehaviorComponent().forEach(go => {
            go.behaviourComponentManager.injectReferencesInBehavour(this);
        });
    }

    start(
        sceneContainer: Container,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ) {
        this.allGameObjects.forEach(go =>
            go.buildAndPlace(sceneContainer, sceneObjectToScreenProportion, size, containerDebug)
        );
        this.findAllWithBehaviorComponent().forEach(go => go.startAndPutToRunUpdates());
    }

    add(gameObject: GameObject) {
        this.allGameObjects.push(gameObject);
    }

    addInPool(poolName: string, allPoolGameObject: GameObject[]) {
        this.poolManager.add(poolName, allPoolGameObject);
    }

    getPool(poolName: string): PoolGameObject {
        return this.poolManager.getPool(poolName);
    }

    getNumberOfPoolsToLoad(): number {
        return this.poolManager.numberOfPools(gameObject => gameObject.hasABuilderComponent);
    }

    getNumberOfObjectInPoolToLoad(): number {
        return this.poolManager.totalObjectsOnPools(gameObject => gameObject.hasABuilderComponent);
    }

    getNumberOfPools(): number {
        return this.poolManager.numberOfPools();
    }

    getNumberOfObjectInPool(): number {
        return this.poolManager.totalObjectsOnPools();
    }

    getTotalLoadableGameObjects(): number {
        return this.allGameObjects.map(gameObject => gameObject.hasABuilderComponent).length;
    }

    addPhysicsEngine(physicsEngine: Engine) {
        this.allGameObjects.forEach(go => go.addPhysicsEngine(physicsEngine));
    }

    findByName(name: string): GameObject | undefined {
        return this.allGameObjects.find(go => go.name === name);
    }

    findAllByPosition(positionNear: Point, maxDistance: number): GameObject[] {
        return this.allGameObjects.filter(({transform: {position}}) => 
            distanceVector2(position, positionNear) <= maxDistance);
    }

    findGameObjectByBody = (body: Body, gameObjectsWithColliders?: GameObject[]): GameObject => {
        if (gameObjectsWithColliders) {
            return gameObjectsWithColliders.find(go => go.collidersComponentManager.hasBody(body))!;
        } else {
            return this.allGameObjects.find(go => go.collidersComponentManager.hasBody(body))!;
        }
   }

    findAllWithColliderComponent(): GameObject[] {
        return this.allGameObjects.filter(go => !!go.collidersComponentManager && go.collidersComponentManager.colliders.length > 0);
    }

    findAllWithBehaviorComponent(): GameObject[] {
        return this.allGameObjects.filter(go => !!go.behaviourComponentManager && !go.behaviourComponentManager.isEmpty);
    }

    findAllBehaviorComponentInAllGameObject(): BehaviourComponent[] {
        return flatArray(this.allGameObjects.filter(go => !!go.behaviourComponentManager)
            .map(({ behaviourComponentManager }) => behaviourComponentManager!.behaviourComponents));
    }

    findAllBodiesInAllGameObject(): Body[] {
        return flatArray(this.allGameObjects.filter(go => !!go.collidersComponentManager)
            .map(go => go.collidersComponentManager.allBodies));
    }

    filterAllGameObjectWithCondition(onCondition: (go: GameObject) => boolean): GameObject[] {
        return this.allGameObjects.filter(onCondition);
    }

    setTweenReferences(goWithTween: GameObject) {
        const tweenComponentManager = goWithTween.tweenComponentManager;
        this.allGameObjects.forEach(reference => tweenComponentManager!.setConfigurationAll(reference));
        const tweensWithoutConfiguration = tweenComponentManager!.filterWithoutConfigure()
        tweensWithoutConfiguration.forEach(t => 
            this.allGameObjects.forEach(reference => t.setConfigurationPoolCase(reference, goWithTween.name))
        );
    }

    destroy() {
        let baseTex: BaseTexture | undefined;
        this.allGameObjects.forEach(go => {
            const candidateTexture = go.destroy();
            if (candidateTexture) {
                baseTex = candidateTexture;
            }
        });
        if (this.poolManager) {
            this.poolManager.destroy();
        }
        if (baseTex) {
            BaseTexture.removeFromCache(baseTex);
            baseTex!.destroy();
        }
        this.allGameObjects = [];
        // if (AEAnimationRouletteLoader.getInstance()) {
        //     AEAnimationRouletteLoader.getInstance().destroyAnimations();
        // }
    }
}
