import { GameObject } from "../../game-object";
import { Color } from "../../../wrappers/color";
import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from "../component";
import { CoreLoader } from "../../../wrappers/static/core-loader";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Game } from "../../game";
import { Container } from "../../../wrappers/container";
import { CoreFilter } from "../../../wrappers/static/core-filters";
import { AnimatedSprite } from "../../../wrappers/animated-sprite";

export class AnimationSpriteComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    public static nameComponent = "AnimationSpriteComponent";
    public isLoaded: boolean;
    public isPlaced: boolean;

    public nameAnimation: string;
    public nameImageFileList: string[]; // TODO: PUT IN scene and templates WELL
    public animationSpeed: number;
    public color: Color;
    
    public imagePathList: string[]; // svg, png, jpg,...
    public sheetdataList: any[];
    public animatedSprite: AnimatedSprite;
    public width: number;
    public height: number;

    set blendMode(newBlendMode: number) {
        this.animatedSprite.blendMode = newBlendMode;
    }

    get blendMode() {
        return this.animatedSprite.blendMode;
    }
    
    constructor(
    ) {
        super();
        this.isLoaded = false;
        this.isPlaced = false;
    }

    initialize = () => {
        this.imagePathList = [];
        this.nameImageFileList.forEach((nameImageFile) => {
            this.imagePathList.push(this.completePath(
                Game.instance.propierties.imageAsssetPaths,
                nameImageFile
            ));
        });
    }

    protected completePath(paths: string[], nameFile: string): string {
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

    private isNotImageLoaded(imagePath: string): boolean {
        return !CoreLoader.getInstance().shared.resources[imagePath];
    }

    load = (): Promise<Component> => {
        return new Promise<Component>((resolve, reject) => {
            CoreLoader.waitWhileIsLoadingInUse().then(() => {
                this.loadEach(0, () => resolve(this));
            });
        });
        // await CoreLoader.waitWhileIsLoadingInUse();
        // for (let imagePath of this.imagePathList) {
        //     if (this.isNotImageLoaded(imagePath)) {
        //         await CoreLoader.getInstance().load([imagePath]);
        //     }
        // }
        // this.sheetdataList = this.imagePathList.map(imagePath => CoreLoader.getInstance().shared.resources[imagePath].spritesheet);
        // this.isLoaded = true;
        // return this;
    }

    private loadEach = (i: number, onFinished: () => void) => {
        if (i === this.imagePathList.length) {
            this.sheetdataList = this.imagePathList.map(imagePath => CoreLoader.getInstance().shared.resources[imagePath].spritesheet);
            this.isLoaded = true;
            onFinished();
        } else {
            const imagePath = this.imagePathList[i];
            if (this.isNotImageLoaded(imagePath)) {
                CoreLoader.getInstance().load([imagePath]).then(() => {
                    setTimeout(() => {
                        this.loadEach(i + 1, onFinished);
                    }, 0);
                });
            } else {
                setTimeout(() => {
                    this.loadEach(i + 1, onFinished);
                }, 0);
            }
        }
    }

    setRender(isRended: boolean) {
        if (this.animatedSprite) {
            this.animatedSprite!.visible = isRended;
            this.animatedSprite!.renderable = isRended;
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
        this.animatedSprite = this.buildSprite(gameObject, sceneObjectToScreenProportion);
        this.setRender(gameObject.isEnabled);
        this.isPlaced = true;
        return this.animatedSprite;
    }

    private completeData = () => {
        if (!this.width) {
            this.width = this.sheetdataList[0].width;
        }
        if (!this.height) {
            this.height = this.sheetdataList[0].height;
        }
    }

    private buildSprite = (gameObject: GameObject, sceneObjectToScreenProportion: {x: number, y: number}): AnimatedSprite => {
        this.animatedSprite = new AnimatedSprite(this.sheetdataList, this.nameAnimation);
        this.animatedSprite.alpha = this.color.a;
        this.animatedSprite.scaleX = gameObject.transform.scale.x * sceneObjectToScreenProportion.x;
        this.animatedSprite.scaleY = gameObject.transform.scale.y * sceneObjectToScreenProportion.y;
        this.animatedSprite.setAnchor(0.5, 0.5);
        
        this.animatedSprite.x = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        this.animatedSprite.y = gameObject.transform.position.y * sceneObjectToScreenProportion.y;

        this.applyColor(this.color, true);
        
        return this.animatedSprite;
    }

    applyColor = (color: Color, useOnlyMatrix = false)  => {
        if (!useOnlyMatrix) {
            this.setOpacity(color.a);
            this.color.r = color.r;
            this.color.g = color.g;
            this.color.b = color.b;
        }

        if (this.color.r >= 255 && this.color.g >= 255 && this.color.b >= 255) {
            CoreFilter.instance.clearAllFilters(this.animatedSprite);
        } else {
            CoreFilter.instance.applyColorMatrixFilter(this.animatedSprite, this.color);
        }
    }

    playAnimation = (isInLoop = false, onAnimationFinished?: (() => void)) => {
        this.animatedSprite.isInLoop = isInLoop;
        this.animatedSprite.animationSpeed = this.animationSpeed;
        this.animatedSprite.play(onAnimationFinished);
    }

    stopAnimation = () => {
        this.animatedSprite.stop();
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === AnimationSpriteComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === AnimationSpriteComponent.nameComponent;
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
        if (this.animatedSprite) {
            this.animatedSprite.x = newPositionX;
            this.animatedSprite.y = newPositionY;
        }
    }

    setScale(newScaleX: number, newScaleY: number) {
        if (this.animatedSprite) {
            this.animatedSprite.scaleX = newScaleX;
            this.animatedSprite.scaleY = newScaleY;
        }
    }

    setRotation(newRotation: number) {
        if (this.animatedSprite) {
            this.animatedSprite.rotation = newRotation;
        }
    }

    setOpacity(newAlpha: number) {
        this.color.a = newAlpha;
        if (this.animatedSprite) {
            this.animatedSprite.alpha = this.color.a;
        }
    }

    destroy = (): BaseTexture | undefined => {
        if (this.animatedSprite) {
            this.animatedSprite.destroy();
        }
        return undefined;
    }

    clone = (): Component => {
        const spriteComponent = new AnimationSpriteComponent();

        spriteComponent.isLoaded = this.isLoaded;
        spriteComponent.isPlaced = this.isPlaced;
        spriteComponent.imagePathList = [...this.imagePathList];
        spriteComponent.nameAnimation = this.nameAnimation;
        spriteComponent.nameImageFileList = [...this.nameImageFileList];
        spriteComponent.animationSpeed = this.animationSpeed;
        spriteComponent.height = this.height;
        spriteComponent.width = this.width;
        spriteComponent.sheetdataList = [...this.sheetdataList];

        if (this.color) {
            spriteComponent.color = this.color;    
        }
        
        if (this.sheetdataList) {
            spriteComponent.sheetdataList = [...this.sheetdataList];
        }

        if (this.animatedSprite) {
            spriteComponent.animatedSprite = new AnimatedSprite(spriteComponent.sheetdataList);
            spriteComponent.animatedSprite.alpha = this.animatedSprite.alpha;
            spriteComponent.animatedSprite.scaleX = this.animatedSprite.scaleX;
            spriteComponent.animatedSprite.scaleY = this.animatedSprite.scaleY;
            spriteComponent.animatedSprite.setAnchor(this.animatedSprite.anchor.x, this.animatedSprite.anchor.y);
            spriteComponent.animatedSprite.x = this.animatedSprite.x;
            spriteComponent.animatedSprite.y = this.animatedSprite.y;
        }
        
        return spriteComponent;
    }
}