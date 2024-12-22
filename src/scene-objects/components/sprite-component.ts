import { Sprite } from "../../wrappers/sprite";
import { GameObject } from "../game-object";
import { Color } from "../../wrappers/color";
import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from "./component";
import { Texture } from "../../wrappers/texture";
import { CoreLoader } from "../../wrappers/static/core-loader";
import { BaseTexture } from "../../wrappers/base-texture";
import { Game } from "../game";
import { Container } from "../../wrappers/container";
import { CoreFilter } from "../../wrappers/static/core-filters";

export class SpriteComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    public static nameComponent = "SpriteComponent";
    public isLoaded: boolean;
    public isPlaced: boolean;
    private texture: Texture;
    private isLoadedSpriteDataForFirstTime: boolean;

    public imagePath: string; // svg, png, jpg,...
    public nameImage: string;
    public color: Color;
    public data: any;
    public sprite: Sprite;
    public width: number;
    public height: number;

    set blendMode(newBlendMode: number) {
        this.sprite.blendMode = newBlendMode;
    }

    get blendMode() {
        return this.sprite.blendMode;
    }
    
    constructor(
    ) {
        super();
        this.isLoaded = false;
        this.isPlaced = false;
        this.isLoadedSpriteDataForFirstTime = false;
    }

    initialize = () => {
        this.imagePath = this.completePath(
            Game.instance.propierties.imageAsssetPaths,
            this.nameImage
        );
    }

    completePath(paths: string[], nameFile: string): string {
        let currentPath: string;
        for (let i = 0; i < paths.length; i++) {
            currentPath = paths[i];
            if (currentPath.includes(nameFile)) {
                return currentPath;
            }
        }
        console.error(`${nameFile} path is missing. Add that path to GameProperties.`);
        return nameFile;
    }

    isNotImageLoaded(): boolean {
        return !CoreLoader.getInstance().shared.resources[this.imagePath];
    }

    load = (): Promise<Component> => {
        this.isLoaded = false;
        CoreLoader.waitWhileIsLoadingInUseByCallback(() => {
            if (this.isNotImageLoaded()) {
                this.isLoadedSpriteDataForFirstTime = true;
                CoreLoader.getInstance().loadCallback(
                    () => {
                        this.data = CoreLoader.getInstance().shared.resources[this.imagePath].data;
                        this.isLoaded = true;
                    },
                    [ this.imagePath ]
                );
            } else {
                this.data = CoreLoader.getInstance().shared.resources[this.imagePath].data;
                this.isLoaded = true;
            }
        });

        return new Promise<Component>((resolve, reject) => this.waitUntilLoadFinished(() => resolve()));
        // await CoreLoader.waitWhileIsLoadingInUse();
        // if (this.isNotImageLoaded()) {
        //     this.isLoadedSpriteDataForFirstTime = true;
        //     await CoreLoader.getInstance().load([ this.imagePath ]);
        // }
        // this.data = CoreLoader.getInstance().shared.resources[this.imagePath].data;
        // this.isLoaded = true;
        // return this;
    }

    private waitUntilLoadFinished = (onLoadFinished: () => void) => {
        if (this.isLoaded) {
            onLoadFinished();
        } else {
            setTimeout(() => this.waitUntilLoadFinished(onLoadFinished), 0);
        }
    }

    setRender(isRended: boolean) {
        if (this.sprite) {
            this.sprite!.visible = isRended;
            this.sprite!.renderable = isRended;
        }
    }
    
    buildAndPlace = (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container => {
        this.completeData();
        this.sprite = this.buildSprite(gameObject, sceneObjectToScreenProportion);
        this.setRender(gameObject.isEnabled);
        this.isPlaced = true;
        return this.sprite;
    }

    private completeData = () => {
        if (!this.width) {
            this.width = this.data.width;
        }
        if (!this.height) {
            this.height = this.data.height;
        }
    }

    private buildSprite = (gameObject: GameObject, sceneObjectToScreenProportion: {x: number, y: number}): Sprite => {
        if (this.isLoadedSpriteDataForFirstTime) {
            if (this.width) {
                this.data.width = this.width;
            }
            if (this.height) {
                this.data.height = this.height;
            }
    
            // console.log(`[${gameObject.name}] width: ${this.data.width}, height: ${this.data.height}`)
            this.data.width *= (gameObject.transform.scale.x * sceneObjectToScreenProportion.x);
            this.data.height *= (gameObject.transform.scale.y * sceneObjectToScreenProportion.y);
        }

        const baseTexture = new BaseTexture(this.data);
        this.texture = new Texture(baseTexture);
        this.sprite = new Sprite(this.texture);
        this.sprite.alpha = this.color.a;
        // this.sprite.scaleX = gameObject.transform.scale.x * sceneObjectToScreenProportion.x;
        // this.sprite.scaleY = gameObject.transform.scale.y * sceneObjectToScreenProportion.y;
        this.sprite.setAnchor(0.5, 0.5);
        
        this.sprite.x = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        this.sprite.y = gameObject.transform.position.y * sceneObjectToScreenProportion.y;

        this.applyColor(this.color, true);
        
        return this.sprite;
    }

    applyColor = (color: Color, useOnlyMatrix = false)  => {
        if (!useOnlyMatrix) {
            this.setOpacity(color.a);
            this.color.r = color.r;
            this.color.g = color.g;
            this.color.b = color.b;
        }

        if (this.color.r >= 255 && this.color.g >= 255 && this.color.b >= 255) {
            CoreFilter.instance.clearAllFilters(this.sprite);
        } else {
            CoreFilter.instance.applyColorMatrixFilter(this.sprite, this.color);
        }
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === SpriteComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === SpriteComponent.nameComponent;
    }

    getComponent = (nameComponent: any): Component | undefined => {
        return this;
    }

    getComponentByStringType = (nameComponent: string): Component | undefined => {
        return this;
    }
    
    getAllComponents = (nameComponent: string): Component[] | undefined => {
        return [this];
    }

    setEnable = (isEnable: boolean): void => {
        this.setRender(isEnable);
    }

    setPosition(newPositionX: number, newPositionY: number) {
        if (this.sprite) {
            this.sprite.x = newPositionX;
            this.sprite.y = newPositionY;
        }
    }

    setScale(newScaleX: number, newScaleY: number) {
        if (this.sprite) {
            this.sprite.scaleX = newScaleX;
            this.sprite.scaleY = newScaleY;
        }
    }

    setRotation(newRotation: number) {
        if (this.sprite) {
            this.sprite.rotation = newRotation;
        }
    }

    setOpacity(newAlpha: number) {
        this.color.a = newAlpha;
        if (this.sprite) {
            this.sprite.alpha = this.color.a;
        }
    }

    destroy = (): BaseTexture | undefined => {
        let baseTex: BaseTexture | undefined;
        if (this.texture) {
            this.isLoaded = false;
            this.isPlaced = false;
            Texture.removeFromCache(this.texture);
            baseTex = this.texture.baseTexture;
            this.texture.destroy(true);
        }
        return baseTex;
    }

    clone = (): Component => {
        const spriteComponent = new SpriteComponent();

        spriteComponent.isLoaded = this.isLoaded;
        spriteComponent.isPlaced = this.isPlaced;
        spriteComponent.imagePath = this.imagePath;
        spriteComponent.nameImage = this.nameImage;
        spriteComponent.height = this.height;
        spriteComponent.width = this.width;
        spriteComponent.data = this.data;

        if (this.color) {
            spriteComponent.color = this.color;    
        }
        
        if (this.texture) {
            const baseTexture = new BaseTexture(this.data);
            spriteComponent.texture = new Texture(baseTexture);
        }

        if (this.sprite) {
            spriteComponent.sprite = new Sprite(this.texture);
            spriteComponent.sprite.alpha = this.sprite.alpha;
            spriteComponent.sprite.scaleX = this.sprite.scaleX;
            spriteComponent.sprite.scaleY = this.sprite.scaleY;
            spriteComponent.sprite.setAnchor(this.sprite.anchor.x, this.sprite.anchor.y);
            spriteComponent.sprite.x = this.sprite.x;
            spriteComponent.sprite.y = this.sprite.y;
        }
        
        return spriteComponent;
    }
}