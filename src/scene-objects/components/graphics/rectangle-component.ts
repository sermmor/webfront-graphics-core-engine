import { GraphicComponent } from "./graphic-component";
import { Component } from "../component";
import { Graphics } from "../../../wrappers/graphics";

export class RectangleComponent extends GraphicComponent {
    public static nameComponent = "RectangleComponent";
    protected x: number;
    protected y: number;
    protected width: number;
    protected height: number;

    protected paintGraphic(
        graphic: Graphics,
        sceneObjectToScreenProportion: { x: number; y: number; }
    ): Graphics {
        graphic.drawRect(
            this.x * sceneObjectToScreenProportion.x,
            this.y * sceneObjectToScreenProportion.y,
            this.width * sceneObjectToScreenProportion.x,
            this.height * sceneObjectToScreenProportion.y,
        );
        return graphic;
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === RectangleComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === RectangleComponent.nameComponent;
    }

    clone(): Component {
        const rectangle = <RectangleComponent> this.cloneParentBuilder(new RectangleComponent());
        rectangle.x = this.x;
        rectangle.y = this.y;
        rectangle.width = this.width;
        rectangle.height = this.height;
        rectangle.container = this.paint(this.sceneObjectToScreenProportion);
        this.setRender(this.container.visible);
        return rectangle;
    }
}
