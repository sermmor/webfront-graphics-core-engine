import { Loader } from 'pixi.js';
import * as request from 'superagent';
import * as element from './element';
import { Asset } from './asset';
import { AEDataInterceptor } from './interceptor';
import { DataAE } from './after-effects';
import { Element, ElementData } from './element/element';

/**
 * Create assets and layers, also load all images includes AfterEffects animation.
 *
 * @class AEDataLoader
 * @memberof PIXI
 * @prop {function} imagePathProxy - Callback with image path before load image. If modify image path before load image,
 * override this member and return newly path
 * @prop {function} createImageLoader - Create PIXI.loader.Loader for loading image. If create PIXI.loader.Loader for you want,
 * override this member and can return another loader
 */
export class AEDataLoader {
    imagePathProxy: (path: any) => any;
    createImageLoader: (imageAssets: any) => Loader;

    constructor() {
        this.imagePathProxy = path => path;
        this.createImageLoader = imageAssets => new Loader('', imageAssets.length);
    }

    static loadLayers(data: DataAE, interceptor?: AEDataInterceptor): Element[] {
        return <Element[]> data.layers!.map((layer: ElementData) => {
            if (interceptor) {
                interceptor.intercept(layer);
            }
            return element.ElementFactory.create(layer!);
        }).filter((layer: Element | null) => layer !== null);
    }

    static resolveReference(layers: Element[], assets: Asset[]) {
        const assetMap: { [key: string]: Asset } = {};
        assets.forEach(asset => {
            assetMap[asset.id!] = asset;
        });
        layers.forEach((layer: Element) => {
            if (layer.isCompType()) {
                layer.setupReference(assetMap);
            } else if (layer.isImageType()) {
                layer.setupImage(assetMap);
            }
        });
    }

    /**
     * Load JSON data by url
     *
     * @memberof PIXI.AEDataLoader#
     * @param {string} - The JSON url
     * @return {Promise}
     */
    loadJSON(jsonPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            request.get(jsonPath).end((err: any, res: any) => {
                if (err) {
                    return reject(err);
                }
                return this.load(res.body, jsonPath, null).then(() => {
                    resolve(res.body);
                }).catch(e => {
                    reject(e);
                });
            });
        });
    }

    /**
     * Load JSON data by url with PIXI.AEDataInterceptor
     *
     * @memberof PIXI.AEDataLoader#
     * @param {string} - The JSON url
     * @param {PIXI.AEDataInterceptor} - The AEDataInterceptor instance
     * @return {Promise}
     */
    loadJSONWithInterceptor(jsonPath: string, interceptor: AEDataInterceptor): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!interceptor) {
                return reject(new Error('required interceptor parameter'));
            }
            return request.get(jsonPath).end((err: any, res: any) => {
                if (err) {
                    return reject(err);
                }
                const data = res.body;
                return this.load(data, jsonPath, interceptor).then(() => {
                    resolve(data);
                }).catch(e => {
                    reject(e);
                });
            });
        });
    }

    loadAssets(data: DataAE, jsonPath: string, interceptor?: AEDataInterceptor): Promise<Asset[]> {
        const baseName = jsonPath.split('/').slice(0, -1).join('/');
        const assets = data.assets!.map((asset: ElementData) => {
            if (interceptor) {
                interceptor.intercept(asset);
            }
            return new Asset(this, asset, baseName);
        });
        const imageAssets = assets.filter((asset: Asset) => {
            return !!asset.imagePath;
        });
        if (imageAssets.length === 0) {
            return new Promise(resolve => resolve(assets));
        }
        return this.loadImages(imageAssets).then(() => assets);
    }

    loadImages(imageAssets: Asset[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const loader = Loader.shared; //FIXME: USE this.createImageLoader(imageAssets); INSTEAD BUT DON'T REPEAT IMAGES.
            
            // if override createImageLoader and use shared PIXI.Loaders,
            // possibly loader.resources has already loaded resource
            const requiredLoadAssets = imageAssets.filter((asset: Asset) => !loader.resources[asset.imagePath]);
            if (requiredLoadAssets.length === 0) {
                imageAssets.forEach((asset: Asset) => {
                    asset.texture = loader.resources[asset.imagePath].texture;
                });
                return resolve();
            }
            requiredLoadAssets.forEach((asset: Asset) => {
                loader.add(asset.imagePath, asset.imagePath);
            });
            loader.onError.add((error: any, _: any, resource: any) => {
                reject(error);
                // reject(error, resource);
            });
            return loader.load((_: any, resources: any) => {
                imageAssets.forEach(asset => asset.texture = resources[asset.imagePath].texture);
                resolve();
            });
        });
    }

    load(data: DataAE, jsonPath: string, interceptor?: AEDataInterceptor | null): Promise<void> {
        if (interceptor === null) {
            interceptor = undefined;
        }
        return this.loadAssets(data, jsonPath, interceptor).then((assets: Asset[]) => {
            if (interceptor === null) {
                interceptor = undefined;
            }
            const layers = AEDataLoader.loadLayers(data, interceptor);
            AEDataLoader.resolveReference(layers, assets);
            data.assets  = assets;
            data.layers  = layers;
        });
    }
}
