export abstract class Pool<T> {
    protected poolList: T[];

    constructor(poolList: T[], private _name: string) {
        this.poolList = [];
        poolList.forEach(item => {
            this.putObject(item);
        });
    }
    
    get name() { return this._name; }
    get length() { return this.poolList.length; }
    get isPoolEmpty() { return this.poolList.length === 0; }

    allPoolObject = (): T[] => this.poolList.map(t => t);

    protected abstract doAfterPutInInPool(item: T): void;

    protected abstract doAfterPutOutFromPool(item: T, newX?: number, newY?: number): void;

    getOneWithoutExtract(): T {
        return this.poolList[0];
    }

    getObject(newX?: number, newY?: number): T {
        const poolObj = this.poolList.pop();
        if (poolObj) {
            this.doAfterPutOutFromPool(poolObj, newX, newY);
        } else {
            console.error("There aren't more elements in Pool!");
        }
        return poolObj!;
    }

    putObject(poolObj: T) {
        this.doAfterPutInInPool(poolObj);
        this.poolList.push(poolObj);
    }
    
    abstract clone(): Pool<T>;

    destroy() {
        this.poolList.forEach(t => {
            if ((<any> t).destroy) {
                (<any> t).destroy();
            }
        });
        this.poolList = [];
    }
}