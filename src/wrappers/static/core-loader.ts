import { Loader as PIXI_Loader, LoaderResource } from 'pixi.js';

export class CoreLoader {
    private static instance: CoreLoader;
    private static sharedLoader: PIXI_Loader;
    private static isLoadingInUse = false;

    constructor(isPixiWebGl: boolean) {
        if (isPixiWebGl) {
            CoreLoader.sharedLoader = PIXI_Loader.shared;
        }
        CoreLoader.instance = this;
        CoreLoader.isLoadingInUse = false;
    }

    get isUsingLoading() {
        return CoreLoader.isLoadingInUse;
    }

    get shared() {
        return CoreLoader.sharedLoader;
    }

    static getInstance(): CoreLoader {
        return CoreLoader.instance;
    }

    static waitWhileIsLoadingInUseByCallback = (onFinished: () => void) => {
        if (!CoreLoader.getInstance().isUsingLoading) {
            onFinished();
        } else {
            setTimeout(() => CoreLoader.waitWhileIsLoadingInUse(onFinished), 0);
        }
    };

    static waitWhileIsLoadingInUse = (onLoading?: () => void): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            if (onLoading) {
                if (!CoreLoader.getInstance().isUsingLoading) {
                    onLoading();
                } else {
                    setTimeout(() => CoreLoader.waitWhileIsLoadingInUse(onLoading), 0);
                }
                resolve();
            } else {
                if (!CoreLoader.getInstance().isUsingLoading) {
                    resolve();
                } else {
                    setTimeout(() => CoreLoader.waitWhileIsLoadingInUse(() => resolve()), 0);
                }
            }
        });
    };

    static getPathImagesNotLoadedYet(pathAssetList: string[]): string[] {
        const pathNotLoaderYetList: string[] = [];
        pathAssetList.forEach(pathAsset => {
            if (!CoreLoader.getInstance().shared.resources[pathAsset]) {
                pathNotLoaderYetList.push(pathAsset);
            }
        });
        return pathNotLoaderYetList;
    }

    static isImageNotLoadedYet(pathAsset: string): boolean {
        return !CoreLoader.getInstance().shared.resources[pathAsset];
    }

    load = (...params: any[]): Promise<{loader: PIXI_Loader; resources: Partial<Record<string, LoaderResource>>;}> => {
        CoreLoader.isLoadingInUse = true;
        return new Promise<{loader: PIXI_Loader; resources: Partial<Record<string, LoaderResource>>;}>((resolve, reject) => {
            this.shared.add(params).load((loader: PIXI_Loader, resources: Partial<Record<string, LoaderResource>>) => {
                CoreLoader.isLoadingInUse = false;
                resolve({loader, resources});
            });
        });
    }

    loadCallback = (cb?: (loader: PIXI_Loader, resources: Partial<Record<string, LoaderResource>>) => void, ...params: any[]) => {
        CoreLoader.isLoadingInUse = true;
        this.shared.add(params).load((loader: PIXI_Loader, resources: Partial<Record<string, LoaderResource>>) => {
            CoreLoader.isLoadingInUse = false;
            if (cb) {
                cb(loader, resources);
            }
        });
    }
}