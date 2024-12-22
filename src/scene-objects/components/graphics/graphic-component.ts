import { Graphics } from "../../../wrappers/graphics";
import { GameObject } from "../../game-object";
import { Component, IComponentLifeCompleted, ITransformableComponent, ITypeableComponent, IViewableComponent, IBuilderComponent } from "../component";
import { BaseTexture } from "../../../wrappers/base-texture";
import { Point } from "../../../wrappers/point";
import { Color } from "../../../wrappers/color";
import { Container } from "../../../wrappers/container";
import { TransformComponent } from "../transform-component";

export abstract class GraphicComponent extends Component implements IComponentLifeCompleted, ITransformableComponent,
        ITypeableComponent, IViewableComponent, IBuilderComponent {
    protected borderColor: Color;
    protected backgroundColor: Color | undefined;
    protected opacity: number;
    protected borderWidth: number;

    protected container: Graphics;
    protected sceneObjectToScreenProportion: {x: number, y: number};
    protected transform: TransformComponent;
    private isPlaced = false;

    get graphicContainer() { return this.container; }
    
    get bounds() {
        return ({
            x: this.container.x,
            y: this.container.y,
            width: this.container.width,
            height: this.container.height,
        });
    }

    constructor() {
        super();
        if (!this.borderColor) {
            this.borderColor = new Color('(0, 0, 0, 0)');
        }
        if (!this.borderWidth) {
            this.borderWidth = 1;
        }
    }

    initialize = () => {}
    load = (): Promise<Component> => new Promise<Component>((resolve, reject) => resolve(this));

    abstract clone(): Component;
    abstract isMyTypeComponent(typeComponent: any): boolean;
    abstract isMyTypeComponentByStringType(nameComponent: string): boolean;
    protected abstract paintGraphic(graphic: Graphics, sceneObjectToScreenProportion: {x: number, y: number}): Graphics;

    buildAndPlace = (
        gameObject: GameObject,
        sceneContainer: Container,
        parent: Container | undefined,
        sceneObjectToScreenProportion: {x: number, y: number},
        size: { width: number; height: number },
        containerDebug: Container | undefined,
    ): Container => {
        this.sceneObjectToScreenProportion = sceneObjectToScreenProportion;
        if (this.container && parent) {
            this.clear(parent);
        }
        this.transform = gameObject.transform;
        this.container = this.paint(sceneObjectToScreenProportion);
        this.container.x = gameObject.transform.position.x * sceneObjectToScreenProportion.x;
        this.container.y = gameObject.transform.position.y * sceneObjectToScreenProportion.y;
        this.container.rotation = gameObject.transform.rotation ? gameObject.transform.rotation : 0;
        this.setRender(gameObject.isEnabled);
        this.isPlaced = true;
        return this.container;
    }

    protected paint = (sceneObjectToScreenProportion: {x: number, y: number}): Graphics => {
        const graphics = new Graphics();
        if (this.backgroundColor) {
            graphics.beginFill(this.backgroundColor.toHexadecimal);
        }
        graphics.lineStyle(this.borderWidth, this.borderColor.toHexadecimal);

        this.paintGraphic(graphics, sceneObjectToScreenProportion);

        if (this.backgroundColor) {
            graphics.endFill();
        }
        if (this.opacity) {
            this.setOpacity(this.opacity);
        }
        return graphics;
    }

    clear = (parent: Container) => {
        this.container.removeChildren();
        this.container.clear();
        parent.removeChild(this.container);
    }

    setOpacity(newAlpha: number) {
        this.opacity = newAlpha;
        if (this.container) {
            this.container.alpha = this.opacity;
        }
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

    setEnable = (isEnable: boolean) => {
        this.setRender(isEnable);
    }

    setRender = (isRended: boolean) => {
        if (this.container) {
            this.container.visible = isRended;
            this.container.renderable = isRended;
        }
    }

    setPosition = (newPositionX: number, newPositionY: number) => {
        this.container.position.x = newPositionX;
        this.container.position.y = newPositionY;
    }

    setScale = (newScaleX: number, newScaleY: number) => {
        this.container.scale.x = newScaleX;
        this.container.scale.y = newScaleY;
    }

    setRotation = (newRotation: number) => {
        this.container.rotation = newRotation;
    }

    destroy = (): BaseTexture | undefined => {
        this.container.clear();
        return undefined;
    }

    protected cloneParentBuilder = (clone: GraphicComponent): GraphicComponent => {
        clone.sceneObjectToScreenProportion = this.sceneObjectToScreenProportion;
        clone.backgroundColor = this.backgroundColor;
        clone.container = this.container;
        clone.isPlaced = this.isPlaced;
        return clone;
    }
}
