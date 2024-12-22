import { GameObject } from "../game-object";
import { Pool } from "./pool-generic";

const poolItemPositionX = -1000;

export class PoolGameObject extends Pool<GameObject> {
    private spawnPositionX: number;
    private spawnPositionY: number;

    protected doAfterPutInInPool(item: GameObject): void {
        this.spawnPositionX = item.transform.position.x;
        this.spawnPositionY = item.transform.position.y;;
        item.enable(false);
        item.setPosition(poolItemPositionX, this.spawnPositionY);
    }

    protected doAfterPutOutFromPool(item: GameObject, newX?: number, newY?: number): void {    
        item.enable(true);
        if (newX && newY) {
            item.setPosition(newX, newY);
        } else {
            item.setPosition(this.spawnPositionX, this.spawnPositionY);
        }
    }
    
    clone(): PoolGameObject {
        return new PoolGameObject([...this.poolList], `${this.name}Copy`);
    }
}