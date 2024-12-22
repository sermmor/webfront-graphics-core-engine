// import 'core-js/modules/es7.object.values';
import { PoolGameObject } from "./pool-game-object";
import { GameObject } from '../game-object';

export class PoolGameObjectManager {
    private poolCollection: {[key: string]: PoolGameObject} = {};

    numberOfPools(conditionToCheck?: (gameObject: GameObject) => boolean): number {
        let size = 0;
        // Object.keys(this.poolCollection).forEach((poolName: string) => {
        for (const poolName in this.poolCollection) {
            if (conditionToCheck && this.poolCollection[poolName].length > 0) {
                if (conditionToCheck(this.poolCollection[poolName].getOneWithoutExtract())) {
                    size++;
                }
            } else {
                size++;
            }
        }
        // });
        return size;
    }

    totalObjectsOnPools(conditionToCheck?: (gameObject: GameObject) => boolean): number {
        let size = 0;
        // Object.keys(this.poolCollection).forEach((poolName: string) => {
        for (const poolName in this.poolCollection) {
            if (conditionToCheck && this.poolCollection[poolName].length > 0) {
                if (conditionToCheck(this.poolCollection[poolName].getOneWithoutExtract())) {
                    size += this.poolCollection[poolName].length;
                }
            } else {
                size += this.poolCollection[poolName].length;
            }
        }
        // });
        return size;
    }

    add(poolName: string, allPoolGameObject: GameObject[]): PoolGameObject {
        return this.poolCollection[poolName] = new PoolGameObject(allPoolGameObject, poolName);
    }

    getPool(poolName: string): PoolGameObject {
        return this.poolCollection[poolName];
    }

    clone() {
        const poolMng = new PoolGameObjectManager();
        // Object.keys(this.poolCollection).forEach((poolName: string) => {
        for (const poolName in this.poolCollection) {
            poolMng.poolCollection[poolName] = this.poolCollection[poolName].clone();
        }
        // });
    }

    destroy() {
        // Object.keys(this.poolCollection).forEach((poolName: string) => {
        for (const poolName in this.poolCollection) {
            this.poolCollection[poolName].destroy();
        }
        // });
        this.poolCollection = {};
    }
}