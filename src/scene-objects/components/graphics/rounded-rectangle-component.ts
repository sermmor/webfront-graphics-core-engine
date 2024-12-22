import { RectangleComponent } from "./rectangle-component";
import { Component } from "../component";
import { Graphics } from "../../../wrappers/graphics";

export class RoundedRectangleComponent extends RectangleComponent {
    public static nameComponentChild = "RoundedRectangleComponent";

    protected radius: number;
    
    protected paintGraphic(
        graphic: Graphics,
        sceneObjectToScreenProportion: { x: number; y: number; }
    ): Graphics {
        graphic.drawRoundedRect(
            this.x * sceneObjectToScreenProportion.x,
            this.y * sceneObjectToScreenProportion.y,
            this.width * sceneObjectToScreenProportion.x,
            this.height * sceneObjectToScreenProportion.y,
            this.radius,
        );
        return graphic;
    }

    isMyTypeComponent = (typeComponent: any): boolean => {
        return typeComponent === RoundedRectangleComponent;
    }

    isMyTypeComponentByStringType = (nameComponent: string): boolean => {
        return nameComponent === RoundedRectangleComponent.nameComponentChild;
    }

    clone(): Component {
        const rectangle = <RoundedRectangleComponent> this.cloneParentBuilder(new RoundedRectangleComponent());
        rectangle.x = this.x;
        rectangle.y = this.y;
        rectangle.width = this.width;
        rectangle.height = this.height;
        rectangle.radius = this.radius;
        rectangle.container = this.paint(this.sceneObjectToScreenProportion);
        this.setRender(this.container.visible);
        return rectangle;
    }
}